---
title: "Paint The Code"
layout: "post"
---

## Table of Contents
- [Background](#background)
- [Idea](#idea)
- [Reading the file safely](#reading-the-file-safely)
- [Tokenizing: turning code into little categories](#tokenizing-turning-code-into-little-categories)
- [Chopping the canvas into rectangles](#chopping-the-canvas-into-rectangles)
- [Putting it together: CLI](#putting-it-together-cli)
- [Takeaways](#takeaways)
- [Footnotes](#footnotes)

---

## Background

At some point I fell (again) into the creative coding rabbit hole.  

I re-read [The Importance of Sketching with Code][sketching] and it really clicked this time:  
instead of thinking “I need a big serious project”, just sketch. make tiny things. weird experiments. save them.

So I wanted a small sketch that:
- uses code as *data* instead of something to execute
- feels a bit like generative art
- doesn’t require a browser or shaders or anything fancy

The result was this little side project: a Python source visualizer that turns any `.py` file into a panel of abstract rectangles.  
Nothing “useful”, but very fun.

Later I created few more variations too, here are some examples results: (input: this very post in markdown!)

<img width="1500" height="463" alt="Figure_3" src="https://github.com/user-attachments/assets/4773e47c-6f6d-4535-8c24-e0c336825c03" />
<img width="1500" height="463" alt="Figure_2" src="https://github.com/user-attachments/assets/d400f0f8-d7b7-46f2-9655-70060b9b87a2" />
<img width="1500" height="463" alt="Figure_1" src="https://github.com/user-attachments/assets/7c033e0f-0ce5-47ca-9e57-9d3f7e5192ef" />
<img width="1500" height="463" alt="Figure_4" src="https://github.com/user-attachments/assets/f95453ad-52a2-41f7-b063-3051c1c90caa" />
<br />

---

## Idea

The core idea is:

> take a Python file → tokenize it → let those tokens influence how a rectangle is recursively split → color each piece depending on what kind of token it came from.

So comments, strings, numbers, keywords, etc. all get their own “visual personality”.

In the end you get something that kind of looks like a Mondrian painting that’s been hit with a syntax highlighter.

---

## Reading the file safely

First tiny function:

```python
def read_text(path):
    """Read the file as plain text, never executing it."""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()
````

Nothing fancy, but the important bit for me: I *never* `import` or `exec` the file.[^1]
It’s just bytes → text. That’s it.

I also explicitly set `errors="replace"` so if the file has weird encoding issues, the visualizer still works and just throws in some replacement characters. Glitch-friendly.

---

## Tokenizing: turning code into little categories

This is where the “code as data” part starts:

```python
def tokenize_source(text):
    """
    Tokenize Python source and group tokens into semantic categories.
    """
    result = []
    reader = io.StringIO(text).readline

    try:
        for tok in tokenize.generate_tokens(reader):
            tok_type, tok_str, start, end, line = tok
            if tok_type in (tokenize.ENCODING, tokenize.NL, tokenize.ENDMARKER):
                continue

            if tok_type == tokenize.COMMENT:
                group = "comment"
            elif tok_type == tokenize.STRING:
                group = "string"
            elif tok_type == tokenize.NUMBER:
                group = "number"
            elif tok_type == tokenize.OP:
                group = "op"
            elif tok_type == tokenize.NAME:
                if keyword.iskeyword(tok_str):
                    group = "keyword"
                else:
                    group = "name"
            else:
                group = "other"

            weight = max(1, len(tok_str))
            result.append({"text": tok_str, "group": group, "weight": weight})
    except tokenize.TokenError:
        result.append({"text": text, "group": "other", "weight": len(text) or 1})

    return result
```

A couple of fun bits here:

* I’m using Python’s built-in `tokenize` module instead of splitting on characters myself.
* Every token falls into one of a small set of groups:
  `keyword`, `name`, `string`, `number`, `comment`, `op`, `other`.
* Each token gets a `weight` that is roughly `len(tok_str)`. Longer tokens = more “influence” later.

The `try/except` is there so that if tokenization fails (e.g., half-written files or snippets), I just treat the whole thing as one big `"other"` block. The sketch should never crash just because the code is ugly.

This matches that “sketching” mindset: it’s allowed to be broken, the tool should still respond somehow.

---

## Chopping the canvas into rectangles

This is the heart of the visualizer:

```python
def build_rectangles(tokens, max_rects=400, min_size=0.02, margin=0.03, rng=None):
    """
    Recursively slice up a big rectangle based on tokens.
    """
    if rng is None:
        rng = random.Random()

    rects = [
        {
            "x": margin,
            "y": margin,
            "w": 1.0 - 2 * margin,
            "h": 1.0 - 2 * margin,
            "group": "background",
            "token": None,
            "depth": 0,
        }
    ]
    if not tokens:
        return rects

    total_weight = sum(t["weight"] for t in tokens) or 1.0
    expanded = []
    target_len = max_rects * 2

    for t in tokens:
        share = t["weight"] / total_weight
        copies = max(1, int(share * target_len))
        expanded.extend([t] * copies)

    rng.shuffle(expanded)
    ...
```

The picture is:

1. Start with one big rectangle (our “canvas”).
2. For each token (biased by that weight), pick a rectangle and split it in two.
3. Repeat until we hit `max_rects` or things get too tiny.

The part I like most is how it picks *which* rectangle to split:

```python
    for t in expanded:
        if len(rects) >= max_rects:
            break

        areas = [r["w"] * r["h"] for r in rects]
        total_area = sum(areas)
        if total_area <= 0:
            break

        pick = rng.random() * total_area
        acc = 0.0
        idx = 0
        for i, a in enumerate(areas):
            acc += a
            if acc >= pick:
                idx = i
                break

        rect = rects.pop(idx)
        ...
```

* Every existing rectangle has a probability proportional to its area.
* Bigger empty spaces get refined first.
* Tiny rectangles are skipped once they fall under `min_size`.

So you get this organic subdivision where some areas are super detailed, others stay chunky.

### Orientation depends on token type

I also let the token *group* influence orientation:

```python
        group = t["group"]
        if group in ("comment", "string"):
            orientation = 1 if rng.random() < 0.7 else 0   # more horizontal
        elif group in ("keyword", "op"):
            orientation = 0 if rng.random() < 0.7 else 1   # more vertical
        else:
            orientation = rng.randint(0, 1)
```

* comments & strings → mostly horizontal cuts
* keywords & operators → mostly vertical
* everything else → whatever

Purely an aesthetic choice, but it makes different files feel different:

* comment-heavy scripts generate these long horizontal bands
* math-y / expression-heavy code leans more into vertical chopping

### Split ratio with jitter

Then I decide where to cut:

```python
        base = {
            "keyword": 0.35,
            "comment": 0.65,
            "string": 0.55,
            "number": 0.45,
            "name": 0.5,
            "op": 0.4,
        }.get(group, 0.5)
        jitter = (rng.random() - 0.5) * 0.3  # ±0.15
        ratio = min(0.8, max(0.2, base + jitter))
```

So:

* each token group has a *typical* split ratio (e.g. comments are a bit 65/35-ish),
* then I nudge it randomly within bounds.

This is one of those tiny details that doesn’t matter logically, but visually it changes things a lot.
The layouts feel less “perfect grid” and more “hand-tuned but slightly drunk”.

Every resulting rectangle keeps track of:

* its `(x, y, w, h)` in `[0, 1]` space
* its `group`
* the `token` text that spawned it (not used visually yet, but could be)
* `depth`, so I can adjust styling based on how many splits it went through.

---

I hardcoded a couple of palettes:

```python
PALETTES = [
    {
        "name": "midnight",
        "background": "#050816",
        "keyword": "#ff6b81",
        "name": "#4dabf7",
        "string": "#ffe066",
        "number": "#b197fc",
        "comment": "#868e96",
        "op": "#ff922b",
        "other": "#e9ecef",
    },
    {
        "name": "pastel",
        "background": "#f8f9fa",
        ...
    },
    ...
]
```

Nothing algorithmic here, I just fiddled with colors until the outputs looked pleasant enough.[^2]

To keep things interesting but reproducible, I do this:

```python
def choose_palettes(text):
    """
    Pick 3 distinct palettes in a deterministic way based on the file contents.
    """
    seed = hash(text) & 0xFFFFFFFF
    rng = random.Random(seed)
    indices = list(range(len(PALETTES)))
    rng.shuffle(indices)
    chosen = [PALETTES[i] for i in indices[:3]]
    return chosen, rng
```

* I hash the **file contents** to seed a local RNG.
* That RNG:

  * chooses 3 palettes for the 3 panels
  * is passed into `build_rectangles` so splits are deterministic too

So: same file → same picture every time (unless you change the code).

This is that “keep track of the random seed” lesson but kind of smuggled into the design.[^3]

### Drawing panels

The function that actually paints rectangles:

```python
def draw_panel(ax, rects, palette, line_mode="thin"):
    ax.set_facecolor(palette["background"])

    if not rects:
        return

    max_depth = max(r["depth"] for r in rects) or 1

    for r in rects:
        group = r["group"]
        color = palette.get(group, palette["other"])

        depth_factor = (r["depth"] + 1) / (max_depth + 1)
        alpha = 0.4 + 0.6 * depth_factor

        if line_mode == "none":
            lw = 0.0
            edgecolor = None
        elif line_mode == "thick":
            lw = 1.5 + 1.5 * depth_factor
            edgecolor = "#000000"
        else:
            lw = 0.4 + 0.6 * depth_factor
            edgecolor = palette["background"]

        rect_patch = Rectangle(
            (r["x"], r["y"]),
            r["w"],
            r["h"],
            linewidth=lw,
            edgecolor=edgecolor,
            facecolor=color,
            alpha=alpha,
        )
        ax.add_patch(rect_patch)
```

Fun bits:

* Color is purely based on `group`, so comments always fight in the same color range, etc.
* Deeper rectangles get slightly higher alpha (less transparent).
* `line_mode` lets me flip between:

  * subtle grid (`thin`)
  * bold black grid (`thick`)
  * completely flat, no strokes (`none`)

I then use three subplots to show three different “moods” of the same layout:

```python
def make_figure(rects, palettes, title=None):
    fig, axes = plt.subplots(1, 3, figsize=(15, 5), constrained_layout=True)

    draw_panel(axes[0], rects, palettes[0], line_mode="thin")
    draw_panel(axes[1], rects, palettes[1], line_mode="thick")
    draw_panel(axes[2], rects, palettes[2], line_mode="none")
    ...
    return fig
```

Same structure, different outfits.

---

## Putting it together: CLI

The rest is just a small command-line wrapper:

```python
def main():
    parser = argparse.ArgumentParser(
        description=(
            "Visualize a Python source file as abstract rectangles.\n"
            "The file is never executed, only read as plain text."
        )
    )
    parser.add_argument("source", help="Path to the .py file to visualize")
    parser.add_argument(
        "-o",
        "--output",
        help="Output image filename (e.g. out.png). "
             "If omitted, the window is just shown.",
    )
    parser.add_argument(
        "--max-rects",
        type=int,
        default=400,
        help="Maximum number of rectangles to generate (default: 400)",
    )

    args = parser.parse_args()

    text = read_text(args.source)
    tokens = tokenize_source(text)

    palettes, rng = choose_palettes(text)
    rects = build_rectangles(tokens, max_rects=args.max_rects, rng=rng)

    title = f"Visualization of: {args.source}"
    fig = make_figure(rects, palettes, title=title)

    if args.output:
        fig.savefig(args.output, dpi=300)
    else:
        plt.show()
```

So running:

```bash
python visualizer.py my_script.py -o my_script.png
```

spits out a PNG of your code.
Running it without `-o` just pops up a Matplotlib window.

---

## Takeaways

1. Code is a great medium to sketch with, even when it’s not doing “real work”.
2. Treating source code as raw data (instead of something to execute) is oddly refreshing.
3. Randomness is fun, but *deterministic* randomness is much more usable.
4. Letting token types leak into visuals (orientation, ratios, colors) makes each file feel like it has its own personality.
5. And finally, once again: sketching is worth it. This started as a “let’s see what happens if…” evening and now I kinda want to build a whole series of tools like this.

---

## Footnotes

[^1]: This is both from the “security” side (don’t execute random files) and from the “art” side – the program should not care if the code even *runs*.

[^2]: I still think a proper generative palette system would be fun. Maybe next sketch.

[^3]: In the Gorilla Sun article they mention keeping track of random seeds when sketching. This is my lazy version of that: the seed is literally the file contents.

[sketching]: https://www.gorillasun.de/blog/the-importance-of-sketching-with-code/
