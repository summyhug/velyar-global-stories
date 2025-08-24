import { useEffect } from "react";
import { Keyboard } from "@capacitor/keyboard";

export function useKeyboardToggle() {
  useEffect(() => {
    const showHandler = Keyboard.addListener("keyboardWillShow", () => {
      document.body.classList.add("keyboard-open");
    });

    const hideHandler = Keyboard.addListener("keyboardWillHide", () => {
      document.body.classList.remove("keyboard-open");
    });

    return () => {
      showHandler.remove();
      hideHandler.remove();
    };
  }, []);
}
