package main

import (
	"testing"

	"github.com/kahlys/boa/gui/cli"
)

func TestFlagReset(t *testing.T) {
	// Create a command map
	cmds := newCommandMap(cli.NewCommand)

	// First execution with --str=hello
	result1, err1 := cmds.Execute("/fake/demo", "--str=hello")
	if err1 != nil {
		t.Fatalf("First execution failed: %v", err1)
	}
	t.Logf("First result:\n%s", result1)

	// Second execution with NO --str flag (should use default)
	result2, err2 := cmds.Execute("/fake/demo")
	if err2 != nil {
		t.Fatalf("Second execution failed: %v", err2)
	}
	t.Logf("Second result:\n%s", result2)

	// Check if str value is different
	if result1 == result2 {
		t.Error("❌ Results are identical - flag value NOT reset!")
	} else {
		t.Log("✓ Flag was reset correctly")
	}

	res, err := cmds.Execute("")
	if err != nil {
		t.Fatalf("Execution with empty command failed: %v", err)
	}
	t.Logf("Result with empty command:\n%s", res)

	t.Error("")
}
