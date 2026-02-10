# Page snapshot

```yaml
- dialog "Unhandled Runtime Error" [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - navigation [ref=e7]:
          - button "previous" [disabled] [ref=e8]:
            - img "previous" [ref=e9]
          - button "next" [disabled] [ref=e11]:
            - img "next" [ref=e12]
          - generic [ref=e14]: 1 of 1 unhandled error
          - generic [ref=e15]:
            - text: Next.js (13.5.1) is outdated
            - link "(learn more)" [ref=e17] [cursor=pointer]:
              - /url: https://nextjs.org/docs/messages/version-staleness
        - button "Close" [ref=e18] [cursor=pointer]:
          - img [ref=e20]
      - heading "Unhandled Runtime Error" [level=1] [ref=e23]
      - paragraph [ref=e24]: "TypeError: Cannot read properties of undefined (reading 'includes')"
    - generic [ref=e25]:
      - heading "Source" [level=2] [ref=e26]
      - generic [ref=e27]:
        - link "components\\pageParts\\CanvasArea.tsx (69:34) @ includes" [ref=e29] [cursor=pointer]:
          - generic [ref=e30]: components\pageParts\CanvasArea.tsx (69:34) @ includes
          - img [ref=e31]
        - generic [ref=e35]: "67 | key={node.id} 68 | node={node} > 69 | selected={selectedIds.includes(node.id)} | ^ 70 | currentTool={tool} 71 | isEditing={editingId === node.id} 72 | onMouseDown={(e: any, n: any) => {"
      - heading "Call Stack" [level=2] [ref=e36]
      - generic [ref=e37]:
        - heading "map" [level=3] [ref=e38]
        - link "components\\pageParts\\CanvasArea.tsx (65:15)" [ref=e39] [cursor=pointer]:
          - generic [ref=e40]: components\pageParts\CanvasArea.tsx (65:15)
          - img [ref=e41]
      - button "Show collapsed frames" [ref=e45] [cursor=pointer]
```