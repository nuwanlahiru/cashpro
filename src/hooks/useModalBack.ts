import { useEffect } from 'react';

/**
 * A hook that handles the hardware back button (or browser back button) 
 * for closing modals and popups on mobile devices.
 * 
 * When the modal opens, it pushes a state to the history. 
 * If the user presses back, it intercepts the popstate and calls onClose.
 * If the user closes the modal normally, it automatically pops the history state
 * to keep the history clean.
 */
export function useModalBack(isOpen: boolean, onClose: () => void, modalId: string = 'modal') {
  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = (e: PopStateEvent) => {
      // The popstate event means the history popped already.
      e.preventDefault();
      onClose();
    };

    // Push a new state specifically for this modal
    window.history.pushState({ [modalId]: true }, '');
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      
      // If we are unmounting or closing, and the history state still indicates
      // that this modal is "open" as the current history state, 
      // we need to pop it programmatically.
      if (window.history.state && window.history.state[modalId]) {
        window.history.back();
      }
    };
  }, [isOpen, onClose, modalId]);
}
