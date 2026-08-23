export const swaggerThemeCss = `
body {
  background:
    radial-gradient(1100px 520px at 0% -10%, rgb(124 58 237 / 0.22), transparent 55%),
    radial-gradient(900px 480px at 100% 110%, rgb(99 102 241 / 0.14), transparent 50%),
    #07060f !important;
  margin: 0;
}

.swagger-ui,
.swagger-ui .info,
.swagger-ui .info .title,
.swagger-ui p,
.swagger-ui a,
.swagger-ui .tab li,
.swagger-ui .opblock-tag,
.swagger-ui .opblock .opblock-summary-operation-id,
.swagger-ui .opblock .opblock-summary-path,
.swagger-ui .opblock .opblock-summary-description,
.swagger-ui .parameter__name,
.swagger-ui .parameter__type,
.swagger-ui table thead tr td,
.swagger-ui table thead tr th,
.swagger-ui .response-col_status,
.swagger-ui .response-col_links,
.swagger-ui .model-title,
.swagger-ui .model,
.swagger-ui label,
.swagger-ui .parameter__deprecated,
.swagger-ui .parameter__in {
  font-family: Inter, 'Segoe UI', system-ui, sans-serif !important;
  color: #f8f7ff !important;
}

.swagger-ui {
  color: #f8f7ff;
}

.swagger-ui .topbar {
  display: none;
}

.swagger-ui .wrapper {
  max-width: 1460px;
  margin-inline: auto;
  padding-inline: 20px;
}

.swagger-ui .information-container.wrapper {
  padding-top: 28px;
}

.swagger-ui .info {
  margin: 0 0 28px;
  padding: 28px 32px;
  border-radius: 20px;
  border: 1px solid rgb(168 85 247 / 0.28);
  background:
    linear-gradient(180deg, rgb(18 16 28 / 0.92), rgb(10 8 18 / 0.96)),
    #12101c;
  box-shadow: 0 24px 64px rgb(0 0 0 / 0.35);
}

.swagger-ui .info .title {
  font-size: 2.15rem !important;
  font-weight: 800 !important;
  letter-spacing: -0.04em;
  background: linear-gradient(180deg, #c084fc 0%, #a855f7 42%, #6366f1 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;
}

.swagger-ui .info .title small {
  background: rgb(168 85 247 / 0.18) !important;
  border: 1px solid rgb(196 181 253 / 0.28);
  color: #e9d5ff !important;
  top: -4px;
}

.swagger-ui .info p,
.swagger-ui .info li {
  color: rgb(248 247 255 / 0.72) !important;
  font-size: 15px;
  line-height: 1.6;
}

.swagger-ui .info a {
  color: #c4b5fd !important;
}

.swagger-ui .scheme-container {
  background: transparent !important;
  box-shadow: none !important;
  border: 0 !important;
  padding: 0 20px !important;
  margin: 0 auto 24px !important;
  max-width: 1460px;
  box-sizing: border-box;
}

.swagger-ui .scheme-container .schemes.wrapper,
.swagger-ui .scheme-container > .wrapper,
.swagger-ui .scheme-container > section {
  max-width: none;
  width: 100%;
  margin: 0;
  padding: 18px 32px !important;
  background: rgb(18 16 28 / 0.92) !important;
  border: 1px solid rgb(168 85 247 / 0.22);
  border-radius: 16px;
  box-shadow: none;
  box-sizing: border-box;
}

.swagger-ui .btn.authorize {
  background: linear-gradient(135deg, #A855F7 0%, #6366F1 100%) !important;
  border: 0 !important;
  color: #fff !important;
  box-shadow: 0 10px 28px rgb(124 58 237 / 0.35);
  border-radius: 10px;
}

.swagger-ui .btn.authorize svg {
  fill: #fff !important;
}

.swagger-ui .btn.execute {
  background: linear-gradient(135deg, #A855F7 0%, #6366F1 100%) !important;
  border: 0 !important;
  color: #fff !important;
  border-radius: 8px;
}

.swagger-ui .btn-group .btn {
  border-color: rgb(168 85 247 / 0.35) !important;
  color: #e9d5ff !important;
  background: transparent !important;
}

.swagger-ui .opblock-tag-section {
  margin-bottom: 12px;
}

.swagger-ui .opblock-tag {
  border-bottom: 1px solid rgb(168 85 247 / 0.18) !important;
  padding: 12px 8px;
}

.swagger-ui .opblock-tag small {
  color: rgb(248 247 255 / 0.55) !important;
}

.swagger-ui .opblock {
  border-radius: 14px !important;
  box-shadow: none !important;
  background: rgb(18 16 28 / 0.72) !important;
  border: 1px solid rgb(168 85 247 / 0.16) !important;
}

.swagger-ui .opblock .opblock-summary-description {
  color: rgb(248 247 255 / 0.62) !important;
}

.swagger-ui .opblock.opblock-get {
  background: rgb(99 102 241 / 0.08) !important;
  border-color: rgb(99 102 241 / 0.35) !important;
}
.swagger-ui .opblock.opblock-get .opblock-summary-method {
  background: #6366F1 !important;
}

.swagger-ui .opblock.opblock-post {
  background: rgb(168 85 247 / 0.08) !important;
  border-color: rgb(168 85 247 / 0.35) !important;
}
.swagger-ui .opblock.opblock-post .opblock-summary-method {
  background: #A855F7 !important;
}

.swagger-ui .opblock.opblock-put,
.swagger-ui .opblock.opblock-patch {
  background: rgb(192 132 252 / 0.08) !important;
  border-color: rgb(192 132 252 / 0.35) !important;
}
.swagger-ui .opblock.opblock-put .opblock-summary-method,
.swagger-ui .opblock.opblock-patch .opblock-summary-method {
  background: #7C3AED !important;
}

.swagger-ui .opblock.opblock-delete {
  background: rgb(239 68 68 / 0.08) !important;
  border-color: rgb(239 68 68 / 0.35) !important;
}
.swagger-ui .opblock.opblock-delete .opblock-summary-method {
  background: #ef4444 !important;
}

.swagger-ui .opblock-body,
.swagger-ui .opblock-section-header,
.swagger-ui .tab-header,
.swagger-ui .highlight-code,
.swagger-ui .responses-inner,
.swagger-ui .model-box,
.swagger-ui section.models {
  background: rgb(10 8 18 / 0.6) !important;
  color: #f8f7ff !important;
}

.swagger-ui .opblock-section-header {
  border-radius: 10px;
  box-shadow: none !important;
  border: 1px solid rgb(168 85 247 / 0.12);
}

.swagger-ui input[type=text],
.swagger-ui input[type=password],
.swagger-ui input[type=search],
.swagger-ui textarea,
.swagger-ui select {
  background: #12101c !important;
  color: #f8f7ff !important;
  border: 1px solid rgb(196 181 253 / 0.28) !important;
  border-radius: 10px !important;
  outline: none;
}

.swagger-ui input:focus,
.swagger-ui textarea:focus {
  border-color: #A855F7 !important;
  box-shadow: 0 0 0 3px rgb(168 85 247 / 0.18);
}

.swagger-ui .filter-container .operation-filter-input {
  background: #12101c !important;
  color: #f8f7ff !important;
  border: 1px solid rgb(168 85 247 / 0.28) !important;
  border-radius: 12px !important;
}

.swagger-ui .dialog-ux .modal-ux {
  background: #12101c !important;
  border: 1px solid rgb(168 85 247 / 0.35) !important;
  border-radius: 16px !important;
  color: #f8f7ff !important;
}

.swagger-ui .dialog-ux .modal-ux-header,
.swagger-ui .dialog-ux .modal-ux-content {
  background: transparent !important;
  border-color: rgb(168 85 247 / 0.18) !important;
}

.swagger-ui .authorization__btn svg,
.swagger-ui .expand-operation svg {
  fill: #c4b5fd !important;
}

.swagger-ui table tbody tr td {
  color: rgb(248 247 255 / 0.78) !important;
  border-color: rgb(168 85 247 / 0.12) !important;
}

.swagger-ui .response-col_status {
  color: #c4b5fd !important;
}

.swagger-ui .microlight {
  background: #0b0914 !important;
  color: #e9d5ff !important;
}

.swagger-ui section.models {
  border: 1px solid rgb(168 85 247 / 0.18) !important;
  border-radius: 14px !important;
}

.swagger-ui .copy-to-clipboard {
  background: rgb(168 85 247 / 0.2) !important;
}

.swagger-ui .servers > label {
  color: #e9d5ff !important;
}
`;
