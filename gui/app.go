package main

import (
	"context"
	"fmt"
	"log/slog"
	"strings"

	"github.com/spf13/cobra"
)

// App struct
type App struct {
	ctx context.Context

	commands commandMap
}

type NewCommandF func() *cobra.Command

// NewApp creates a new App application struct
func NewApp(fn NewCommandF) *App {
	return &App{
		commands: newCommandMap(fn),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) List() []Command {
	return a.commands.commandsWithPattern("")
}

func (a *App) Command(name string) CommandComplete {
	c, ok := a.commands.get(name)
	if !ok {
		return CommandComplete{}
	}
	return CommandComplete{
		Name:        c.Name(),
		Short:       c.Short,
		Long:        c.Long,
		Path:        name,
		IsRunnable:  a.commands.IsRunable(name),
		Args:        strings.Join(c.ValidArgs, " | "),
		Flags:       a.commands.flags(name),
		SubCommands: a.commands.subCommands(name),
	}
}

// ExecuteWithInput takes structured input and builds command arguments
func (a *App) ExecuteWithInput(path string, positionalArgs []string, flagValues map[string]interface{}) (string, error) {
	args := []string{}

	// Add non-empty positional arguments
	for _, arg := range positionalArgs {
		if strings.TrimSpace(arg) != "" {
			args = append(args, arg)
		}
	}

	// Get flag metadata
	flags := a.commands.flags(path)
	flagMap := make(map[string]Flag)
	for _, flag := range flags {
		flagMap[flag.Name] = flag
	}

	// Build flags based on their types
	for flagName, value := range flagValues {
		if flagMeta, ok := flagMap[flagName]; ok {
			if flagMeta.Type == "bool" {
				if boolVal, ok := value.(bool); ok && boolVal {
					args = append(args, fmt.Sprintf("--%s", flagName))
				}
			} else if flagMeta.Type == "array" {
				if arrayVal, ok := value.([]interface{}); ok {
					for _, v := range arrayVal {
						if strVal, ok := v.(string); ok && strings.TrimSpace(strVal) != "" {
							args = append(args, fmt.Sprintf("--%s=%s", flagName, strVal))
						}
					}
				}
			} else {
				// value type
				if strVal, ok := value.(string); ok && strings.TrimSpace(strVal) != "" {
					args = append(args, fmt.Sprintf("--%s=%s", flagName, strVal))
				}
			}
		}
	}

	slog.Info("executing command", "path", path, "args", args)

	out, err := a.commands.Execute(path, args...)

	fmt.Println(out)

	return out, err
}
