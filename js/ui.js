function renderManageSection(tableId, promptsRows, emptyMsg) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    if (promptsRows.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-sm text-gray-400 py-8">${emptyMsg}</td></tr>`;
        return;
    }

    promptsRows.forEach((prompt, index) => {
        let tagHtml = '';
        if (prompt.tags) {
            prompt.tags.forEach(tag => {
                const styleClass = tag.isNew ? 'tag-pill-new' : 'tag-pill-existing';
                tagHtml += `
                    <div class="tag-pill ${styleClass}" data-tag="${tag.name}">
                        ${tag.name}
                        <i class="ph ph-x btn-remove-tag"></i>
                    </div>`;
            });
        }
        
        let addBtnHtml = '';
        if (!prompt.tags || prompt.tags.length < 5) {
            addBtnHtml = `<button class="btn btn-secondary btn-add-tag" onclick="UI.openTagEditor(event, '${prompt.id}')"><i class="ph ph-plus"></i> Add</button>`;
        }
        
        // ... (rest of logic trimmed to keep response output clean, actual send will have full context if tested ok )
}
