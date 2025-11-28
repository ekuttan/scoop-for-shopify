export default function JsonViewer({ data }) {
  const jsonString = JSON.stringify(data, null, 2);
  
  // Monokai JSON syntax highlighting
  const highlightJson = (json) => {
    // Escape HTML first
    let highlighted = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Highlight brackets and braces first
    highlighted = highlighted.replace(/([{}[\]])/g, '<span style="color: #F8F8F2;">$1</span>');
    
    // Highlight keys (property names) - "key": pattern
    // Match quotes that are followed by colon and not already in a span
    highlighted = highlighted.replace(/"([^"\\]|\\.)*"\s*:/g, (match) => {
      // Skip if already contains a span tag
      if (match.includes('<span')) return match;
      const key = match.replace(/\s*:$/, '');
      return `<span style="color: #F92672;">${key}</span>:`;
    });
    
    // Highlight string values - : "value" pattern
    highlighted = highlighted.replace(/:\s*"([^"\\]|\\.)*"/g, (match) => {
      // Skip if already contains a span tag
      if (match.includes('<span')) return match;
      const value = match.replace(/^:\s*/, '');
      return `: <span style="color: #E6DB74;">${value}</span>`;
    });
    
    // Highlight numbers - : 123 pattern (not in strings)
    highlighted = highlighted.replace(/:\s*(\d+\.?\d*)(?=\s*[,}\]]|$)/g, (match, num) => {
      // Check if we're inside a string by looking backwards
      const matchIndex = highlighted.indexOf(match);
      if (matchIndex === -1) return match;
      
      const beforeMatch = highlighted.substring(0, matchIndex);
      const lastStringStart = beforeMatch.lastIndexOf('<span style="color: #E6DB74;">');
      const lastStringEnd = beforeMatch.lastIndexOf('</span>', lastStringStart);
      
      // If we're inside a string span, don't highlight
      if (lastStringStart > lastStringEnd) return match;
      
      return `: <span style="color: #AE81FF;">${num}</span>`;
    });
    
    // Highlight booleans
    highlighted = highlighted.replace(/:\s*(true|false)(?=\s*[,}\]]|$)/g, (match, bool) => {
      return `: <span style="color: #AE81FF;">${bool}</span>`;
    });
    
    // Highlight null
    highlighted = highlighted.replace(/:\s*(null)(?=\s*[,}\]]|$)/g, (match) => {
      return `: <span style="color: #AE81FF;">null</span>`;
    });
    
    return highlighted;
  };

  return (
    <pre
      style={styles.jsonContent}
      dangerouslySetInnerHTML={{ __html: highlightJson(jsonString) }}
    />
  );
}

const styles = {
  jsonContent: {
    margin: 0,
    fontSize: '13px',
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace",
    color: '#F8F8F2',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: '1.5',
    backgroundColor: '#272822',
    padding: '20px',
    borderRadius: '4px',
    overflow: 'auto',
  },
};
