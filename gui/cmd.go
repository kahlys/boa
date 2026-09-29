package main

import (
	"bytes"
	"fmt"
	"path"
	"sort"
	"strings"

	"github.com/spf13/cobra"
	"github.com/spf13/pflag"
)

type commandMap struct {
	cmdf NewCommandF
	root string
	cmds map[string]*cobra.Command
}

func newCommandMap(fn NewCommandF) commandMap {
	cmd := fn()
	cmds := commandMap{
		cmdf: fn,
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
	// rootCmd, ok := c.get(c.root)
	// if !ok {
	// 	return "", fmt.Errorf("command not found")
	// }

	// subCmd, _, err := rootCmd.Find(c.commandPath(name))
	// if err != nil {
	// 	return "", err
	// }
	// subCmd.Flags().VisitAll(func(flag *pflag.Flag) {
	// 	flag.Value.Set(flag.DefValue)
	// 	flag.Changed = false
	// })

	rootCmd := c.cmdf()

	buf := &bytes.Buffer{}
	rootCmd.SetArgs(append(c.commandPath(name), args...))
	rootCmd.SetOut(buf)
	rootCmd.SilenceErrors = true
	rootCmd.SilenceUsage = true

	if err := rootCmd.Execute(); err != nil {
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

type CommandComplete struct {
	Name        string
	Short       string
	Path        string
	Long        string
	IsRunnable  bool
	Args        string
	Flags       []Flag
	SubCommands []Command
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
