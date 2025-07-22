class LutHello extends HTMLElement {
    constructor() {
        super();    
    }
    connectedCallback() {
        const styles = new CSSStyleSheet();
        styles.replaceSync("span { font-weight: 800 }")
        const shadow = this.attachShadow({ mode: "open" });
        shadow.adoptedStyleSheets = [styles];
        const text = this.getAttribute("data-text");
        const span = document.createElement("span");
        span.textContent = text;
        shadow.appendChild(span);
    }
}
customElements.define("lut-hello", LutHello);


export { LutHello }
