package boa

import (
	"bytes"
	_ "embed"
	"fmt"
	"html/template"
	"log/slog"
	"net/http"
	"path"
	"sort"
	"strings"

	"github.com/spf13/cobra"
	"github.com/spf13/pflag"
)

// Server is a simple web server that displays the commands and allows the user to run them.
type Server struct {
	Port int

	commands    commandMap
	httpHandler http.Handler
}

// New creates a new Server with the given port and cobra command.
func New(cmd *cobra.Command, port int) *Server {
	s := &Server{
		Port:     port,
		commands: newCommandMap(cmd),
	}
	s.httpHandler = s.newHTTPHandler()
	return s
}

// ListenAndServe starts the server and listens on the configured port.
func (s *Server) ListenAndServe() {
	slog.Info("server_start", "address", fmt.Sprintf("http://localhost:%d", s.Port))
	err := http.ListenAndServe(fmt.Sprintf(":%v", s.Port), s.httpHandler)
	if err != nil {
		slog.Error("server_stop", "reason", err.Error())
	}
}

type commandMap struct {
	root string
	cmds map[string]*cobra.Command
}

func newCommandMap(cmd *cobra.Command) commandMap {
	cmds := commandMap{
		root: fmt.Sprintf("/%v", cmd.Name()),
		cmds: map[string]*cobra.Command{},
	}
	cmd.SetHelpCommand(&cobra.Command{Hidden: true})
	addSubCommandsRecursive(cmd, cmds, "")
	return cmds
}

func addSubCommandsRecursive(cmd *cobra.Command, cmds commandMap, name string) {
	cmds.add(fmt.Sprintf("%v/%v", name, cmd.Name()), cmd)
	for _, c := range cmd.Commands() {
		addSubCommandsRecursive(c, cmds, fmt.Sprintf("%v/%v", name, cmd.Name()))
	}
}

func (c commandMap) Execute(name string, args ...string) (string, error) {
	buf := &bytes.Buffer{}

	cmd, ok := c.get(c.root)
	if !ok {
		return "", fmt.Errorf("command not found")
	}

	args = append(
		c.commandPath(name),
		args...,
	)
	cmd.SetArgs(args)
	cmd.SetOut(buf)
	cmd.SilenceErrors = true
	cmd.SilenceUsage = true

	if err := cmd.Execute(); err != nil {
		return "", err
	}

	return buf.String(), nil
}

func (c commandMap) commandPath(name string) []string {
	name = strings.TrimPrefix(name, c.root)
	name = strings.TrimPrefix(name, "/")
	return strings.Split(name, "/")
}

func (c commandMap) add(name string, cmd *cobra.Command) {
	c.cmds[name] = cmd
}

func (c commandMap) get(name string) (*cobra.Command, bool) {
	name = c.fixName(name)
	cmd, ok := c.cmds[name]
	return cmd, ok
}

func (c commandMap) fixName(name string) string {
	if name == "" || name == "/" {
		return c.root
	}
	return name
}

func (c commandMap) IsRunable(name string) bool {
	cmd, ok := c.get(name)
	if !ok {
		return false
	}
	return cmd.Run != nil
}

type Command struct {
	Name         string
	NameComplete string
	Path         string
	Description  string
	Use          string
}

// commandsWithPattern returns a list of commands that match the given pattern.
// It searches for the pattern in the command names, short descriptions, long descriptions, and usage strings.
// The returned commands are sorted by their paths in ascending order.
func (c commandMap) commandsWithPattern(pattern string) []Command {
	pattern = strings.ToLower(pattern)
	cmds := []Command{}
	for k := range c.cmds {
		switch {
		case strings.Contains(strings.ToLower(c.cmds[k].Name()), pattern):
		case strings.Contains(strings.ToLower(c.cmds[k].Short), pattern):
		case strings.Contains(strings.ToLower(c.cmds[k].Long), pattern):
		case strings.Contains(strings.ToLower(c.cmds[k].Use), pattern):
		default:
			continue
		}
		cmds = append(
			cmds,
			Command{
				Name:         c.cmds[k].Name(),
				NameComplete: strings.TrimSpace(strings.ReplaceAll(k, "/", " ")),
				Path:         k,
				Description:  c.cmds[k].Short,
				Use:          c.cmds[k].Use,
			})
	}
	sort.Slice(cmds, func(i, j int) bool {
		return cmds[i].Path < cmds[j].Path
	})
	return cmds
}

// subCommands returns a list of subcommands for the given command name.
func (c commandMap) subCommands(name string) []Command {
	name = c.fixName(name)
	cur, ok := c.get(name)
	if !ok {
		return []Command{}
	}

	keepSub := func(cmd *cobra.Command) bool {
		if cmd == nil || cmd.Hidden || cmd.Name() == "" {
			return false
		}
		_, ok := c.cmds[path.Join(name, cmd.Name())]
		return ok
	}

	subs := []Command{}
	for _, sub := range cur.Commands() {
		if !keepSub(sub) {
			continue
		}
		subs = append(subs, Command{Name: sub.Name(), Path: path.Join(name, sub.Name()), Description: sub.Short, Use: sub.Use})
	}
	return subs
}

type Flag struct {
	Name        string
	Description string
	Shorthand   string
	Type        string
}

func (c commandMap) flags(name string) []Flag {
	cur, ok := c.get(name)
	if !ok {
		return []Flag{}
	}

	keepFlag := func(flag *pflag.Flag) bool {
		return flag.Name != "" && flag.Name != "help" && flag.Name != "version"
	}

	flagType := func(flag *pflag.Flag) string {
		switch t := flag.Value.Type(); {
		case t == "bool":
			return "bool"
		case strings.Contains(t, "Array"), strings.Contains(t, "Slice"), strings.Contains(t, "To"):
			return "array"
		default:
			return "value"
		}
	}

	flags := []Flag{}
	cur.InheritedFlags().VisitAll(func(flag *pflag.Flag) {
		if !keepFlag(flag) {
			return
		}
		flags = append(flags, Flag{Name: flag.Name, Shorthand: flag.Shorthand, Description: flag.Usage, Type: flagType(flag)})
	})
	cur.LocalFlags().VisitAll(func(flag *pflag.Flag) {
		if !keepFlag(flag) {
			return
		}
		flags = append(flags, Flag{Name: flag.Name, Shorthand: flag.Shorthand, Description: flag.Usage, Type: flagType(flag)})
	})
	return flags
}

//go:embed templates/bootstrap.min.css
var cssFile string

//go:embed templates/htmx.min.js
var htmxFile string

//go:embed templates/command.gohtml
var cmdFile string

//go:embed templates/command_output.gohtml
var cmdOutputFile string

//go:embed templates/list.gohtml
var listFile string

//go:embed templates/list_body.gohtml
var listBodyFile string

//go:embed templates/page.gohtml
var pageFile string

var (
	commandHTMLTemplateSrc  = template.Must(template.New("commandHTML").Parse(cmdFile))
	commandOutputHTMLSrc    = template.Must(template.New("commandOutput").Parse(cmdOutputFile))
	listHTMLTemplateSrc     = template.Must(template.New("list").Parse(listFile))
	listBodyHTMLTemplateSrc = template.Must(template.New("listBody").Parse(listBodyFile))
	pageHTMLTemplateSrc     = template.Must(template.New("page").Parse(pageFile))
)

func (s *Server) newHTTPHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/", s.handler)
	return mux
}

func (s *Server) handler(w http.ResponseWriter, r *http.Request) {
	switch p := r.URL.Path; {
	case p == "/":
		s.handleList(w, r)
	case p == "/favicon.ico":
		return
	case strings.HasPrefix(p, "/command/"):
		s.handleCommand(w, r)
	default:
		http.NotFound(w, r)
	}
}

func (s *Server) handleList(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		s.handleListPOST(w, r)
		return
	}

	pattern := r.URL.Query().Get("search")
	slog.Info("page_list", "search", pattern)

	var str bytes.Buffer
	if err := listHTMLTemplateSrc.Execute(&str, nil); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	generatePageHTML(w, "List of commands", str.String())
}

func (s *Server) handleListPOST(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	pattern := r.PostForm.Get("search")

	slog.Info("page_list_body", "search", pattern)

	if err := listBodyHTMLTemplateSrc.Execute(
		w,
		struct {
			Commands []Command
		}{
			Commands: s.commands.commandsWithPattern(pattern),
		},
	); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (s *Server) handleCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		s.handleCommandPOST(w, r)
		return
	}

	currentCmd := strings.TrimPrefix(r.URL.Path, "/command")
	slog.Info("page_command", "cmd", currentCmd)

	var str bytes.Buffer
	c, ok := s.commands.get(currentCmd)
	if !ok {
		http.Error(w, "command not found", http.StatusNotFound)
		return
	}
	if err := commandHTMLTemplateSrc.Execute(
		&str,
		struct {
			Name        string
			Short       string
			Path        string
			Long        string
			IsRunnable  bool
			Flags       []Flag
			SubCommands []Command
		}{
			Name:        c.Name(),
			Short:       c.Short,
			Long:        c.Long,
			Path:        currentCmd,
			IsRunnable:  s.commands.IsRunable(currentCmd),
			Flags:       s.commands.flags(currentCmd),
			SubCommands: s.commands.subCommands(currentCmd),
		},
	); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	generatePageHTML(w, "Command", str.String())
}

func (s *Server) handleCommandPOST(w http.ResponseWriter, r *http.Request) {
	currentCmd := strings.TrimPrefix(r.URL.Path, "/command")
	slog.Info("page_command_run", "cmd", currentCmd)

	err := r.ParseForm()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	flags := []string{}
	args := []string{}
	for key, values := range r.PostForm {
		for _, value := range values {
			if value == "" {
				continue
			}
			switch {
			case strings.HasPrefix(key, "flag"):
				flags = append(flags, []string{fmt.Sprintf("--%v=%v", strings.TrimPrefix(key, "flag"), value)}...)
			case key == "args":
				args = append(args, value)
			}
		}
	}

	slog.Info("command_exec", "cmd", currentCmd, "flags", flags, "args", args)

	output, outputErr := "", ""
	output, err = s.commands.Execute(currentCmd, append(args, flags...)...)
	if err != nil {
		slog.Error("cmd_run_failed", "reason", err.Error(), "cmd", currentCmd, "flags", flags)
		outputErr = err.Error()
	} else if output == "" {
		output = "Command executed successfully"
	}

	if err := commandOutputHTMLSrc.Execute(
		w,
		struct {
			Output      string
			OutputError string
		}{
			Output:      output,
			OutputError: outputErr,
		},
	); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func generatePageHTML(w http.ResponseWriter, title, content string) {
	if err := pageHTMLTemplateSrc.Execute(
		w,
		struct {
			Title   string
			CSS     template.CSS
			JS      template.JS
			Content template.HTML
		}{
			Title:   title,
			CSS:     template.CSS(cssFile),
			Content: template.HTML(content),
			JS:      template.JS(htmxFile),
		},
	); err != nil {
		slog.Info("html_page_generation_failed:", "reason", err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
