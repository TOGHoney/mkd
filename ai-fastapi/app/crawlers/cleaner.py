import hashlib
import re
from typing import Dict, Any
from bs4 import BeautifulSoup, Comment


def compute_content_hash(text: str) -> str:
    """Computes the SHA-256 hash of normalized text for change detection and deduplication."""
    normalized = re.sub(r'\s+', ' ', text.strip())
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()


def clean_html_to_markdown(html_content: str, base_url: str = "") -> Dict[str, Any]:
    """
    Cleans raw HTML by stripping boilerplate elements (navbars, headers, footers, scripts,
    cookie consent banners, ads) and transforms the content into structured Markdown.
    """
    if not html_content or not html_content.strip():
        return {
            "title": "",
            "markdown": "",
            "content_hash": compute_content_hash(""),
            "char_count": 0
        }

    soup = BeautifulSoup(html_content, "html.parser")

    # 1. Extract Title
    title = ""
    title_tag = soup.find("title")
    if title_tag and title_tag.string:
        title = title_tag.string.strip()
    elif soup.find("h1"):
        title = soup.find("h1").get_text(strip=True)

    # 2. Remove comments
    for comment in soup.find_all(text=lambda text: isinstance(text, Comment)):
        comment.extract()

    # 3. Remove non-content structural elements
    unwanted_tags = [
        "script", "style", "nav", "footer", "header", "noscript",
        "iframe", "svg", "form", "button", "aside", "select", "option", "canvas"
    ]
    for tag in soup.find_all(unwanted_tags):
        tag.decompose()

    # 4. Remove cookie banners, ads, and modal overlays by class/id patterns
    banner_patterns = re.compile(
        r"(cookie|consent|banner|ad-container|advertisement|popup|modal|newsletter|social-share)",
        re.IGNORECASE
    )
    for element in soup.find_all(attrs={"class": banner_patterns}):
        element.decompose()
    for element in soup.find_all(attrs={"id": banner_patterns}):
        element.decompose()

    # 5. Extract main content container if present
    main_container = soup.find("main") or soup.find("article") or soup.find(id=re.compile(r"(content|main)", re.I)) or soup.body or soup

    # 6. Convert HTML to Markdown
    markdown_lines = []

    for element in main_container.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "pre", "blockquote", "table"]):
        name = element.name

        if name == "h1":
            text = element.get_text(strip=True)
            if text:
                markdown_lines.append(f"\n# {text}\n")
        elif name == "h2":
            text = element.get_text(strip=True)
            if text:
                markdown_lines.append(f"\n## {text}\n")
        elif name == "h3":
            text = element.get_text(strip=True)
            if text:
                markdown_lines.append(f"\n### {text}\n")
        elif name in ["h4", "h5", "h6"]:
            text = element.get_text(strip=True)
            if text:
                markdown_lines.append(f"\n#### {text}\n")
        elif name == "p":
            text = element.get_text(strip=True)
            if text and len(text) > 3:
                markdown_lines.append(f"{text}\n")
        elif name == "blockquote":
            text = element.get_text(strip=True)
            if text:
                markdown_lines.append(f"> {text}\n")
        elif name == "pre":
            code = element.get_text()
            if code.strip():
                markdown_lines.append(f"```\n{code.strip()}\n```\n")
        elif name in ["ul", "ol"]:
            for li in element.find_all("li", recursive=False):
                li_text = li.get_text(strip=True)
                if li_text:
                    markdown_lines.append(f"- {li_text}")
            markdown_lines.append("")
        elif name == "table":
            rows = element.find_all("tr")
            if rows:
                table_md = []
                for i, row in enumerate(rows):
                    cols = [c.get_text(strip=True) for c in row.find_all(["th", "td"])]
                    if cols:
                        table_md.append("| " + " | ".join(cols) + " |")
                        if i == 0:
                            table_md.append("| " + " | ".join(["---"] * len(cols)) + " |")
                if table_md:
                    markdown_lines.append("\n" + "\n".join(table_md) + "\n")

    # If no semantic tags found, fall back to cleaned text
    if not markdown_lines:
        raw_text = main_container.get_text(separator="\n", strip=True)
        markdown_lines = [raw_text]

    clean_markdown = "\n".join(markdown_lines)
    # Collapse multiple blank lines into max 2
    clean_markdown = re.sub(r'\n{3,}', '\n\n', clean_markdown).strip()

    return {
        "title": title or "Untitled Document",
        "markdown": clean_markdown,
        "content_hash": compute_content_hash(clean_markdown),
        "char_count": len(clean_markdown)
    }
