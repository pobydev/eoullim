import DOMPurify from "dompurify";

/**
 * HTML 콘텐츠를 sanitize하여 XSS 공격을 방지합니다.
 * @param dirty HTML 문자열
 * @returns Sanitized HTML 문자열
 */
export function sanitizeHtml(dirty: string): string {
  // HTML 엔티티 디코딩 (이스케이프된 HTML을 원래대로 복원)
  let decoded = dirty;
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = dirty;
    decoded = textarea.value;
  } else {
    // 서버 사이드에서는 간단한 디코딩
    decoded = dirty
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  // 클라이언트 사이드에서만 DOMPurify 사용
  if (typeof window === "undefined") {
    // 서버 사이드에서는 디코딩된 원본 반환 (클라이언트에서 sanitize)
    return decoded;
  }

  return DOMPurify.sanitize(decoded, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "span",
      "div",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "a",
      "img",
      "hr",
    ],
    ALLOWED_ATTR: [
      "style",
      "class",
      "href",
      "target",
      "rel",
      "src",
      "alt",
      "title",
      "width",
      "height",
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
  });
}




