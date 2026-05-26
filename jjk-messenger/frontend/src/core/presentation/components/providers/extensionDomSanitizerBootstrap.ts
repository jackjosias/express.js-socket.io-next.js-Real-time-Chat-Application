export const extensionDomSanitizerBootstrapScript = `
(() => {
  const blockedNames = new Set([
    "bis_register",
    "bis_skin_checked",
    "cz-shortcut-listen",
    "data-dynamic-id",
  ]);
  const blockedPrefixes = ["__processed_", "bis_", "data-bis-"];
  const extensionScriptProtocol = "chrome-extension:";
  const knownBisExtensionId = "eppiocemhmnlbhjplcgkofciiegomcon";

  function shouldRemoveAttribute(name) {
    return blockedNames.has(name) || blockedPrefixes.some((prefix) => name.startsWith(prefix));
  }

  function cleanElementAttributes(element) {
    for (const name of element.getAttributeNames()) {
      if (shouldRemoveAttribute(name)) {
        element.removeAttribute(name);
      }
    }
  }

  function isKnownBisExtensionScript(element) {
    const src = element.getAttribute("src") || "";
    return element.tagName === "SCRIPT"
      && src.startsWith(extensionScriptProtocol)
      && (
        src.includes(knownBisExtensionId)
        || element.hasAttribute("bis_use")
        || element.hasAttribute("data-bis-config")
      );
  }

  function cleanTree(root) {
    if (root.nodeType === 1) {
      cleanElementAttributes(root);
    }

    if (!root.querySelectorAll) {
      return;
    }

    for (const element of root.querySelectorAll("*")) {
      if (isKnownBisExtensionScript(element)) {
        element.remove();
        continue;
      }

      cleanElementAttributes(element);
    }
  }

  cleanTree(document.documentElement);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.target.nodeType === 1) {
        cleanElementAttributes(mutation.target);
      }

      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) {
          continue;
        }

        if (isKnownBisExtensionScript(node)) {
          node.remove();
          continue;
        }

        cleanTree(node);
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  const finish = () => {
    cleanTree(document.documentElement);
    window.setTimeout(() => observer.disconnect(), 5000);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", finish, { once: true });
  } else {
    finish();
  }
})();
`;
