export class LieutenantBase extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.showLoading();
        this.styles = this.getAttribute("data-styles");
        this.content = this.getAttribute("data-content");
        this.render();
    }
    showLoading() {
        this.clearContent();
        this.appendChild(new LieutenantSpinner);
    }
    showError(message) {
        this.clearContent();
        this.appendChild(new LieutenantError(message));
    }
    async render() {
        try {
            const response = await fetch(this.styles);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const stylesText = await response.text();
            const stylesheet = new CSSStyleSheet();
            stylesheet.replaceSync(stylesText);
            const shadow = this.attachShadow({ mode: "open" });
            shadow.adoptedStyleSheets = [stylesheet];
            this.renderContent();
        }
        catch(error) {
            console.error(`Fetch problem: ${error.message}`);
            this.showError("Something went wrong.");
        }
    }
    async renderContent() {
        try {
            const response = await fetch(this.content);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            this.removeLoading();
            const htmlText = await response.text();
            this.shadowRoot.innerHTML = htmlText;
        }
        catch(error) {
            console.error(`Fetch problem: ${error.message}`);
            this.showError("Something went wrong.");
        }
    }
    clearContent() {
        if (this.shadowRoot) {
            this.shadowRoot.adoptedStyleSheets.length = 0;
        }
        this.childNodes.forEach((node) => {
            node.remove();
        });
    }
    removeLoading() {
        this.querySelector("lieutenant-spinner").remove();
    }
}
customElements.define("lieutenant-base", LieutenantBase);


export class LieutenantSpinner extends LieutenantBase {
    constructor() {
        super();
    }
    connectedCallback() {
        this.textContent = "Loading..."
    }
}
customElements.define("lieutenant-spinner", LieutenantSpinner);


export class LieutenantError extends LieutenantBase {
    constructor(message) {
        super()
        this.message = message;
    }
    connectedCallback() {
        this.textContent = this.message;
    }
}
customElements.define("lieutenant-error", LieutenantError);

export class BaseComp extends LieutenantBase {};
customElements.define("base-comp", BaseComp);
