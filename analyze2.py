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

# Track paren depth carefully and show where it goes positive
js_lines = lines[script_start + 1 : 1636]

depth = 0
paren_depth = 0
in_string = None
prev_char = ""
in_line_comment = False

# Track paren depth changes - only print when it changes
for i, line in enumerate(js_lines):
    file_line = script_start + 2 + i
    in_line_comment = False
    line_paren_start = paren_depth

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

        if char == "(":
            paren_depth += 1
        elif char == ")":
            paren_depth -= 1

        prev_char = char

    # Print lines where paren depth changed
    if paren_depth != line_paren_start:
        print(
            f"Line {file_line}: paren_depth {line_paren_start} -> {paren_depth} | {line.rstrip()[:120]}"
        )

print(f"\nFinal paren_depth at line 1636: {paren_depth}")
