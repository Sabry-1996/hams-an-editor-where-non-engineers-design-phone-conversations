# PART 2 · THINK: Judgment, in writing

This document captures reflections on code review practices, architectural paradigms, and the engineering judgment required when scaling applications across diverse channels (from web chat to voice).

---

## 1. React Code Review: `useFlowEditor` Hook

When reviewing state management and hooks in React, subtle mutation bugs often slip past automated tests or junior drafts. 

### Critical Issues Identified
1. **Direct State Mutation in `updateNode`**  
   * **Problem:** Mutating `node.data` directly (`Object.assign(node.data, patch)`) bypasses React's reference check on `setFlow(flow)`, leading to silent UI rendering bugs.  
   * **Solution:** Enforce immutable updates utilizing the spread operator.
2. **Infinite Loop / Missing Dependency Array in `useEffect`**  
   * **Problem:** Omitting the dependency array causes `useEffect` to execute on every render. Calling `setFlow` within this lifecycle triggers runaway loops and exhausts local storage.  
   * **Solution:** Explicitly pass `[flow]` as the dependency.
3. **Array Mutation in History**  
   * **Problem:** `history.pop()` mutates the history array in-place. React state arrays must always be treated as immutable.  
   * **Solution:** Use immutable array methods like `slice()`.
4. **Non-null Assertion Runtime Safety**  
   * **Problem:** `const node = flow.nodes.find(...)!` risks an unhandled runtime crash if the node ID cannot be resolved.  
   * **Solution:** Implement proper guards or optional chaining.

### Corrected Implementation
```typescript
import { useState, useEffect } from 'react';

export interface Flow {
  nodes: Array<{ id: string; data: Record<string, any> }>;
}

export function useFlowEditor(initial: Flow) {
  const [flow, setFlow] = useState<Flow>(initial);
  const [history, setHistory<Flow[]>([]);

  useEffect(() => {
    localStorage.setItem('flow', JSON.stringify(flow));
  }, [flow]);

  const updateNode = (id: string, patch: Record<string, any>) => {
    setHistory((prev) => [...prev, flow]);
    setFlow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...patch } } : node
      ),
    }));
  };

  const deleteNode = (id: string) => {
    setHistory((prev) => [...prev, flow]);
    setFlow((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== id),
    }));
  };

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setFlow(previous);
  };

  return { flow, updateNode, deleteNode, undo };
}
```

---

## 2. Vue to React: Architectural Translation & Mindset Shift

Transitioning from Vue to React requires adjusting to fundamentally different reactive philosophies:

* **Fine-grained Reactivity (Vue) vs. Re-render Cycles (React):** Vue's Proxy-based system tracks dependencies automatically, updating precise DOM nodes. React triggers full component re-renders, necessitating manual optimization via `useMemo`, `useCallback`, and dependency arrays.
* **Two-Way Binding (`v-model`) vs. Controlled Inputs:** Vue minimizes boilerplate via `v-model`, whereas React relies on explicit `value` and `onChange` handling.
* **Architectural Mapping:**
  1. *Component* $\rightarrow$ Functional components with JSX.
  2. *Composable* $\rightarrow$ Custom Hooks (subject to strict re-render execution rules).
  3. *Store* $\rightarrow$ Pinia/Vuex mapped to Zustand or Redux Toolkit.
  4. *Service* $\rightarrow$ Pure TypeScript utility modules.

---

## 3. When Chat Becomes Voice: Channel Constraints

Moving a conversation builder from text channels (WhatsApp/Chat) to voice calls (telephony) breaks core assumptions:

* **Visual Elements Disappear:** Quick replies, carousels, and rich menus vanish, leaving users stranded if branching relies solely on visual cues.
* **Cognitive Load:** Long text paragraphs sound robotic and exhausting via Text-to-Speech (TTS).
* **Latency & Barge-in:** Voice demands handling interruptions, natural pauses, and STT misinterpretations.

### Channel-Aware Mitigations
* **Channel-Specific Linter:** Grey out or block UI-dependent nodes when the project channel is set to "Voice".
* **TTS Simulation:** Enforce strict character limits on prompt nodes and integrate live audio preview.
* **Mandatory Fallbacks:** Require explicit "No-input" and "Fallback" paths for retry logic.

---

## 4. Handling Architectural Disagreements

When team members bypass established guidelines (such as a 4-layer architecture) under the label of "ceremony," mentorship should focus on the **why** rather than enforcing blind compliance:
1. **Explain Scalability and Testability:** Separation of concerns makes unit testing and caching predictable.
2. **Open Dialogue:** Use 1-on-1 syncs and architecture reviews to capture feedback, refine guides, and prevent architectural drift.