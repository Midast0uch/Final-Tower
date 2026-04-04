import re

with open(
    r"C:\Users\midas\Desktop\Apps\opencode-test\tower-defense.html",
    "r",
    encoding="utf-8",
) as f:
    lines = f.readlines()

script_start = None
for i, line in enumerate(lines):
    if "<script>" in line and script_start is None:
        script_start = i
        break

# Check brace balance from start of JS to line 1636
js_lines = lines[script_start + 1 : 1636]

depth = 0
paren_depth = 0
bracket_depth = 0
in_string = None
prev_char = ""

for i, line in enumerate(js_lines):
    file_line = script_start + 2 + i
    in_line_comment = False

    for j, char in enumerate(line):
        # Handle line comments
        if char == "/" and prev_char == "/" and in_string is None:
            in_line_comment = True
            prev_char = char
            continue

        if in_line_comment:
            prev_char = char
            continue

        # Handle strings (simple check)
        if char in ('"', "'", "`") and prev_char != "\\":
            if in_string is None:
                in_string = char
            elif in_string == char:
                in_string = None

        if in_string:
            prev_char = char
            continue

        # Track depths
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth < 0:
                print(
                    f"NEGATIVE BRACE DEPTH at line {file_line}, col {j + 1}: {line.strip()[:80]}"
                )
                depth = 0
        elif char == "(":
            paren_depth += 1
        elif char == ")":
            paren_depth -= 1
            if paren_depth < 0:
                print(
                    f"NEGATIVE PAREN DEPTH at line {file_line}, col {j + 1}: {line.strip()[:80]}"
                )
                paren_depth = 0
        elif char == "[":
            bracket_depth += 1
        elif char == "]":
            bracket_depth -= 1
            if bracket_depth < 0:
                print(
                    f"NEGATIVE BRACKET DEPTH at line {file_line}, col {j + 1}: {line.strip()[:80]}"
                )
                bracket_depth = 0

        prev_char = char

print(
    f"Final depths at line 1636: braces={depth}, parens={paren_depth}, brackets={bracket_depth}"
)
print(f"In string: {in_string}")

# Now do a full file check
print("\n=== Full file brace tracking ===")
depth = 0
paren_depth = 0
all_errors = []

for i, line in enumerate(lines):
    file_line = i + 1
    in_line_comment = False
    in_string = None
    prev_char = ""

    for j, char in enumerate(line):
        if char == "/" and prev_char == "/" and in_string is None:
            in_line_comment = True
            prev_char = char
            continue

        if in_line_comment:
            prev_char = char
            continue

        if char in ('"', "'", "`") and prev_char != "\\":
            if in_string is None:
                in_string = char
            elif in_string == char:
                in_string = None

        if in_string:
            prev_char = char
            continue

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth < 0:
                all_errors.append(
                    f"NEGATIVE BRACE at line {file_line}: {line.strip()[:80]}"
                )
                depth = 0
        elif char == "(":
            paren_depth += 1
        elif char == ")":
            paren_depth -= 1
            if paren_depth < 0:
                all_errors.append(
                    f"NEGATIVE PAREN at line {file_line}: {line.strip()[:80]}"
                )
                paren_depth = 0

        prev_char = char

print(f"Final depths: braces={depth}, parens={paren_depth}")
print(f"Total negative depth errors: {len(all_errors)}")
for e in all_errors[:20]:
    print(f"  {e}")
