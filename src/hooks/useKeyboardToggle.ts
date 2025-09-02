import { useEffect } from "react";
import { Keyboard } from "@capacitor/keyboard";

export function useKeyboardToggle() {
  useEffect(() => {
    let showHandler: any;
    let hideHandler: any;

    const setupListeners = async () => {
      showHandler = await Keyboard.addListener("keyboardWillShow", () => {
        document.body.classList.add("keyboard-open");
      });

      hideHandler = await Keyboard.addListener("keyboardWillHide", () => {
        document.body.classList.remove("keyboard-open");
      });
    };

    setupListeners();

    return () => {
      if (showHandler) showHandler.remove();
      if (hideHandler) hideHandler.remove();
    };
  }, []);
}
