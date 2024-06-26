package example

import (
	"github.com/spf13/cobra"
)

var (
	flagGlobal      string
	flagStr         string
	flagInt         int
	flagBool        bool
	flagarraystring []string
	flagarraybool   []bool
	flagMap         map[string]string
)

func NewCommand() *cobra.Command {
	root := &cobra.Command{
		Use:   "fake",
		Short: "A fake program",
		Long:  "This is a fake program to demonstrate the use of cobra",
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			cmd.Println("Fake command persistent pre run")
		},
		PreRun: func(cmd *cobra.Command, args []string) {
			cmd.Println("Fake command pre run")
		},
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Println("Fake command run")
		},
	}

	root.PersistentFlags().StringVar(&flagGlobal, "global", "", "a global flag")

	root.AddCommand(subCommand())
	root.AddCommand(emptyCommand())
	root.AddCommand(norunCommand())

	return root
}

func subCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "demo",
		Short: "A demo command",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Println("global:", flagGlobal)
			cmd.Println("str:", flagStr)
			cmd.Println("int:", flagInt)
			cmd.Println("bool:", flagBool)
			cmd.Println("array:", flagarraystring)
			cmd.Println("arraybool:", flagarraybool)
			cmd.Println("map:", flagMap)
			cmd.Println("args:", args)
		},
	}

	cmd.Flags().StringVarP(&flagStr, "str", "s", "", "a string flag (required)")
	cmd.Flags().IntVarP(&flagInt, "int", "i", 0, "an int flag")
	cmd.Flags().BoolVarP(&flagBool, "bool", "b", false, "a bool flag")
	cmd.Flags().StringArrayVarP(&flagarraystring, "array", "a", []string{}, "a string array flag")
	cmd.Flags().BoolSliceVarP(&flagarraybool, "arraybool", "c", []bool{}, "a bool array flag")
	cmd.Flags().StringToStringVarP(&flagMap, "map", "m", map[string]string{}, "a string to string map flag")

	cmd.MarkFlagRequired("str")

	return cmd
}

func norunCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "norun",
		Short: "A command with no run",
	}
}

func emptyCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "empty",
		Short: "A command that does nothing",
		Run:   func(cmd *cobra.Command, args []string) {},
	}
}
