export class LieutenantBase extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });
        this.loadingHeight = this.getAttribute("data-loading-height");
        this.loadingWidth = this.getAttribute("data-loading-width");
        this.stylesSource = this.getAttribute("data-styles");
        this.contentSource = this.getAttribute("data-content");
        this.formSource = this.getAttribute("data-form");
        this.render();
    }
    showLoading(container=this.shadowRoot, height=this.loadingHeight, width=this.loadingWidth, stashChildNodes=true) {
        if (stashChildNodes) this.stashChildNodes(container);
        container.appendChild(new LieutenantSpinner(height, width));
    }
    showError(message) {
        this.stashChildNodes();
        this.shadowRoot.appendChild(new LieutenantError(message));
    }
    async render(styles=this.stylesSource) {
        this.showLoading();
        try {
            const response = await fetch(styles);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const stylesText = await response.text();
            const stylesheet = new CSSStyleSheet();
            stylesheet.replaceSync(stylesText);
            this.shadowRoot.adoptedStyleSheets = [stylesheet];
            this.renderContent();
        }
        catch(error) {
            console.error(`Fetch problem: ${error.message}`);
            this.showError("Something went wrong.");
        }
    }
    async renderContent(parentNode=this.shadowRoot, content=this.contentSource, proceed=true) {
        try {
            const response = await fetch(content);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const htmlText = await response.text();
            const htmlTextStripped = htmlText.trim().replaceAll(/>\s+</g, "><");
            const contentNodes = Document.parseHTMLUnsafe(htmlTextStripped).body.childNodes;
            this.removeLoading();
            for (const contentNode of contentNodes) {
                parentNode.appendChild(contentNode);
            }
            if (proceed) this.proceed();
        }
        catch(error) {
            console.error(`Fetch problem: ${error.message}`);
            this.showError("Something went wrong.");
        }
    }
    async renderForm(parentNode=this.shadowRoot, form=this.formSource, callback=null) {
        try {
            const response = await fetch(form);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const htmlText = await response.text();
            const htmlTextStripped = htmlText.trim().replaceAll(/>\s+</g, "><");
            const contentNodes = Document.parseHTMLUnsafe(htmlTextStripped).body.childNodes;
            this.removeLoading();
            for (const contentNode of contentNodes) {
                parentNode.appendChild(contentNode);
            }
            const formNode = parentNode.querySelector("form");
            console.log(formNode);
            formNode.addEventListener("submit", (event) => {
                event.preventDefault();
                new FormData(formNode);
            });
            formNode.addEventListener("formdata", (event) => {
                console.log(event);
                const payload = new Object();
                for (const entry of event.formData.entries()) {
                    payload[entry[0]] = entry[1];
                }
                console.log(payload);
                // const validName = /^[A-Za-z]{3}$/.test(payload["name"]);
                // if (validName) {
                //     this.sendScore(payload);
                //     this.highScoreForm.querySelector('input[type="submit"]').remove();
                // }
                // else {
                //     this.highScoreForm.formMessage.textContent = "Name must be three letters.";
                // }
            });
            if (callback) callback();
        }
        catch(error) {
            console.error(`Fetch problem: ${error.message}`);
            this.showError("Something went wrong.");
        }
    }
    stashChildNodes(parentNode=this.shadowRoot) {
        this.stashedChildNodes = Array.from(parentNode.childNodes);
        this.stashedChildNodes.forEach((node) => {
            node.remove();
        });
    }
    restoreContent(parentNode=this.shadowRoot) {
        this.removeLoading();
        this.stashedChildNodes.forEach((node) => {
            parentNode.appendChild(node);
        });
        this.stashedChildNodes = null;
    }
    removeLoading() {
        const spinner = this.shadowRoot.querySelector("lieutenant-spinner");
        if (spinner) spinner.remove();
    }
    proceed() {
        // Override in subclasses
        return
    }
    async fetch(resource, options, callback) {
        this.showLoading();
        try {
            const response = await fetch(resource);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const json = await response.json();
            this.restoreContent();
            callback(json);
        }
        catch(error) {
            console.error(`Fetch problem: ${error.message}`);
            this.showError("Something went wrong.");
        }
    }
}
customElements.define("lieutenant-base", LieutenantBase);


export class LieutenantSpinner extends LieutenantBase {
    constructor(height, width) {
        super();
        // this.height = (parseInt(height) + parseInt(width)) / 2;
        // this.width = (parseInt(width) + parseInt(height)) / 2;
        if (height > width) {
            this.sideLength = height / 2;
        } else {
            this.sideLength = width / 2;
        }
    }
    connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });
        const stylesheet = new CSSStyleSheet();
        const stylesText = `
            .container {
                display: grid;
                place-items:center;
                height: ${this.sideLength}px;
                width: ${this.sideLength}px;
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


export class HelloWorld extends LieutenantBase {};
customElements.define("hello-world", HelloWorld);


export class SimpleCard extends LieutenantBase {
    proceed() {
        const resource = this.getAttribute("data-resource");
        this.fetch(resource, null, (data) => {
            this.shadowRoot.querySelector(".title").textContent = data.title;
            this.shadowRoot.querySelector(".body").textContent = data.body;
            this.shadowRoot.querySelector(".footer").textContent = data.footer;
            const editButton = this.shadowRoot.querySelector(".edit-button");
            editButton.addEventListener("click", (event) => {
                const container = this.shadowRoot.querySelector(".container");
                this.showLoading(container, 225, 385);
                this.renderForm(container, "forms/simple_card_form.html", () => {
                    const form = container.querySelector("form");
                    const cancelButton = container.querySelector(".cancel-button");
                    cancelButton.addEventListener("click", (event) => {
                        form.remove();
                        this.showLoading(container, 255, 385, false);
                        this.restoreContent(container);
                    });
                });
            });
        });
    }
}
customElements.define("simple-card", SimpleCard);
