export class LieutenantBase extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });
        this.showLoading();
        this.styles = this.getAttribute("data-styles");
        this.content = this.getAttribute("data-content");
        this.render();
    }
    showLoading() {
        this.clearContent();
        const loadingWidth = this.getAttribute("data-loading-width");
        const loadingHeight = this.getAttribute("data-loading-height");
        this.shadowRoot.appendChild(new LieutenantSpinner(loadingWidth, loadingHeight));
    }
    showError(message) {
        this.clearContent();
        this.shadowRoot.appendChild(new LieutenantError(message));
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
            this.renderContentWith(stylesheet);
        }
        catch(error) {
            console.error(`Fetch problem: ${error.message}`);
            this.showError("Something went wrong.");
        }
    }
    async renderContentWith(stylesheet) {
        try {
            const response = await fetch(this.content);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const htmlText = await response.text();
            this.shadowRoot.adoptedStyleSheets = [stylesheet];
            const contentNodes = Document.parseHTMLUnsafe(htmlText).body.childNodes;
            for (const contentNode of contentNodes) {
                this.shadowRoot.appendChild(contentNode);
            }
            this.removeLoading();
            this.continue();
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
        this.shadowRoot.childNodes.forEach((node) => {
            node.remove();
        });
    }
    removeLoading() {
        this.shadowRoot.querySelector("lieutenant-spinner").remove();
    }
    continue() {
        // Override in subclasses
        return
    }
}
customElements.define("lieutenant-base", LieutenantBase);


export class LieutenantSpinner extends LieutenantBase {
    constructor(width, height) {
        super();
        this.width = width;
        this.height = height;
    }
    connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });
        const stylesheet = new CSSStyleSheet();
        const stylesText = `
            .container {
                display: grid;
                place-items:center;
                width: ${this.width}px;
                height: ${this.height}px;
            }

            .spinner {
                height: 50%;
                width: 50%;
                border-radius: 50%;
                border: 3px solid var(--theme-darkest);
                border-top: 3px solid var(--theme-light);
                animation: spin 0.7s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `
        stylesheet.replaceSync(stylesText);
        shadow.adoptedStyleSheets = [stylesheet];
        const container = document.createElement("div");
        container.classList.add("container");
        const spinner = document.createElement("div");
        spinner.classList.add("spinner");
        container.appendChild(spinner);
        shadow.appendChild(container);
    }
}
customElements.define("lieutenant-spinner", LieutenantSpinner);


export class LieutenantError extends LieutenantBase {
    constructor(message) {
        super()
        this.message = message;
    }
    connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });
        const stylesheet = new CSSStyleSheet();
        const stylesText = `
            .error {
                color: var(--theme-text);
                text-align:-enter;
            }
        `
        stylesheet.replaceSync(stylesText);
        shadow.adoptedStyleSheets = [stylesheet];
        const p = document.createElement("p");
        p.classList.add("error");
        p.textContent = this.message;
        shadow.appendChild(p);
    }
}
customElements.define("lieutenant-error", LieutenantError);


export class BaseComp extends LieutenantBase {};
customElements.define("base-comp", BaseComp);
