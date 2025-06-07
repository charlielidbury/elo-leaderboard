# Font Switching Guide

This project includes a sophisticated serif font system with 5 carefully selected fonts. Here's how to switch between them easily.

## Available Fonts

1. **IBM Plex Serif** (Default)

   - Professional & modern serif typeface designed by IBM
   - Excellent for body text and headings
   - Available weights: 300, 400, 500, 600, 700

2. **Literata**

   - Google's modern book-type serif, used in Google Play Books
   - Optimized for reading longer texts
   - Available weights: 200-900

3. **Source Serif 4**

   - Adobe's open-source companion to Source Sans and Source Code
   - Clean, professional appearance
   - Available weights: 200-900

4. **Tinos**

   - Metric-compatible with Times New Roman, but more refined for digital display
   - Great for traditional, academic looks
   - Available weights: 400, 700 (with italic support)

5. **Cormorant Garamond**
   - A stylized, elegant Garamond revival
   - Better for headlines than body text
   - Available weights: 300, 400, 500, 600, 700

## How to Switch Fonts

### Method 1: Change the Active Font (Easiest)

1. Open `lib/fonts.ts`
2. Find the line: `export const ACTIVE_FONT: FontType = "ibm-plex-serif";`
3. Change the value to one of these options:
   - `"ibm-plex-serif"`
   - `"literata"`
   - `"source-serif-4"`
   - `"tinos"`
   - `"cormorant-garamond"`

### Method 2: Use Tailwind Classes (For specific elements)

You can use these Tailwind classes to apply specific fonts to individual elements:

```jsx
<h1 className="font-cormorant-garamond">Elegant Headline</h1>
<p className="font-literata">Body text in Literata</p>
<span className="font-tinos">Times-like text</span>
```

### Method 3: Use CSS Variables (Advanced)

You can directly use the CSS variables in your custom CSS:

```css
.my-element {
  font-family: var(--font-literata), serif;
}
```

## Font Information

All fonts are loaded via Next.js font optimization, which means:

- ✅ Zero layout shift
- ✅ Automatic font optimization
- ✅ Self-hosted for better performance
- ✅ Preloaded for faster rendering

## Recommendations

- **For body text**: IBM Plex Serif, Literata, or Source Serif 4
- **For headings**: Any font works well, but Cormorant Garamond is particularly elegant
- **For traditional look**: Tinos (Times New Roman alternative)
- **For modern professional**: IBM Plex Serif or Source Serif 4
- **For reading-heavy content**: Literata

## Need More Fonts?

To add more fonts:

1. Add the import to `lib/fonts.ts`
2. Configure the font with appropriate weights
3. Add it to the `fontConfigs` object
4. Update the `FontType` type
5. Add the CSS variable to Tailwind config
6. Update this guide!
