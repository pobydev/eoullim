import DOMPurify from "dompurify";

/**
 * HTML 콘텐츠를 sanitize하여 XSS 공격을 방지합니다.
 * @param dirty HTML 문자열
 * @returns Sanitized HTML 문자열
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") {
    // 서버 사이드에서는 기본적으로 HTML 태그 제거
    return dirty.replace(/<[^>]*>/g, "");
  }

  return DOMPurify.sanitize(dirty, {
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



