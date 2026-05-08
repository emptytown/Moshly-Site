/**
 * Moshly Modal Manager
 * Standardizes modal behavior (Drawers, Centered, Context) to prevent interference.
 */

const ModalManager = {
    activeModals: [],

    open(id, options = {}) {
        const overlay = document.getElementById(id);
        if (!overlay) return;

        // Close others if requested (prevent interference)
        if (options.closeOthers) {
            this.closeAll();
        }

        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        
        // Handle specific modal types that might need extra care
        if (id === 'dbMobDrawer') {
            const backdrop = document.getElementById('dbMobBackdrop');
            if (backdrop) backdrop.classList.add('open');
        }

        if (!this.activeModals.includes(id)) {
            this.activeModals.push(id);
        }

        // Prevent body scroll if any modal is open
        document.body.style.overflow = 'hidden';

        if (options.onOpen) options.onOpen();
    },

    close(id) {
        const overlay = document.getElementById(id);
        if (!overlay) return;

        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');

        if (id === 'dbMobDrawer') {
            const backdrop = document.getElementById('dbMobBackdrop');
            if (backdrop) backdrop.classList.remove('open');
        }

        this.activeModals = this.activeModals.filter(m => m !== id);

        if (this.activeModals.length === 0) {
            document.body.style.overflow = '';
        }
    },

    closeAll() {
        // Create a copy to avoid mutation issues while iterating
        [...this.activeModals].forEach(id => this.close(id));
    }
};

// --- Standardized UI Functions (Mapping to IDs in dashboard.html) ---

function openProfileOverlay() {
    ModalManager.open('dbProfileOverlay', { closeOthers: true });
}

function closeProfileOverlay() {
    ModalManager.close('dbProfileOverlay');
}

function openProjectModal(projectId, mode) {
    const titleEl = document.querySelector('.db-proj-modal-title');
    const confirmBtn = document.getElementById('dbProjConfirmBtn');
    const cancelBtn = document.querySelector('.db-proj-cancel');
    const nameInput = document.getElementById('dbProjName');
    const genreInput = document.getElementById('dbProjGenre');
    const locationInput = document.getElementById('dbProjBasedOn');
    const descInput = document.getElementById('dbProjDesc');
    const notesInput = document.getElementById('dbProjNotes');

    const setFieldsReadonly = (readonly) => {
        [nameInput, genreInput, locationInput, descInput, notesInput].forEach(el => {
            if (el) el.disabled = readonly;
        });
        document.querySelectorAll('.db-proj-type-btn').forEach(b => {
            b.disabled = readonly;
            b.style.pointerEvents = readonly ? 'none' : '';
        });
    };

    // Reset type selection
    document.querySelectorAll('.db-proj-type-btn').forEach(b => b.classList.remove('active'));

    if (mode && projectId) {
        const project = (window._dashProjects || []).find(p => String(p.id) === String(projectId));
        if (!project) { ModalManager.open('dbProjModalOverlay', { closeOthers: true }); return; }

        if (nameInput) nameInput.value = project.name || '';
        if (genreInput) genreInput.value = project.genre || '';
        if (locationInput) locationInput.value = project.location || '';
        if (descInput) descInput.value = project.description || '';
        if (notesInput) notesInput.value = project.notes || '';

        const typeBtn = document.querySelector(`.db-proj-type-btn[data-type="${project.type}"]`);
        if (typeBtn) typeBtn.classList.add('active');

        if (mode === 'view') {
            if (titleEl) titleEl.textContent = project.name;
            setFieldsReadonly(true);
            if (confirmBtn) {
                confirmBtn.textContent = 'Edit';
                confirmBtn.onclick = () => { closeProjectModal(); openProjectModal(projectId, 'edit'); };
            }
            if (cancelBtn) cancelBtn.textContent = 'Close';
        } else if (mode === 'edit') {
            if (titleEl) titleEl.textContent = 'Edit Project';
            setFieldsReadonly(false);
            if (confirmBtn) {
                confirmBtn.textContent = 'Save Changes';
                confirmBtn.onclick = () => window.submitEditProject && window.submitEditProject(projectId);
            }
            if (cancelBtn) cancelBtn.textContent = 'Cancel';
        }
    } else {
        // Create mode — reset all fields
        if (titleEl) titleEl.textContent = 'New Project';
        if (nameInput) nameInput.value = '';
        if (genreInput) genreInput.value = '';
        if (locationInput) locationInput.value = '';
        if (descInput) descInput.value = '';
        if (notesInput) notesInput.value = '';
        const defaultType = document.querySelector('.db-proj-type-btn[data-type="artist"]');
        if (defaultType) defaultType.classList.add('active');
        setFieldsReadonly(false);
        if (confirmBtn) {
            confirmBtn.textContent = 'Create Project';
            confirmBtn.onclick = () => window.submitCreateProject && window.submitCreateProject();
        }
        if (cancelBtn) cancelBtn.textContent = 'Cancel';
    }

    ModalManager.open('dbProjModalOverlay', { closeOthers: true });
}

function closeProjectModal() {
    ModalManager.close('dbProjModalOverlay');
}

function openProjectsManagerModal() {
    ModalManager.open('dbProjectsManagerOverlay', { closeOthers: true });
}

function closeProjectsManagerModal() {
    ModalManager.close('dbProjectsManagerOverlay');
}

function openAppConnectorModal() {
    ModalManager.open('dbAppConnectorOverlay', { closeOthers: true });
}

function closeAppConnectorModal() {
    ModalManager.close('dbAppConnectorOverlay');
}

function openAuditLogModal() {
    ModalManager.open('dbAuditLogOverlay', { closeOthers: true });
}

function closeAuditLogModal() {
    ModalManager.close('dbAuditLogOverlay');
}

function openProjectContextModal() {
    ModalManager.open('dbProjectContextOverlay', { closeOthers: true });
}

function closeProjectContextModal() {
    ModalManager.close('dbProjectContextOverlay');
}

function selectProjectType(btn) {
    if (!btn) return;
    // Remove active class from all sibling buttons
    const parent = btn.parentElement;
    if (parent) {
        parent.querySelectorAll('.db-proj-type-btn').forEach(el => el.classList.remove('active'));
    }
    // Add active class to clicked button
    btn.classList.add('active');
}

function openMobDrawer() {
    ModalManager.open('dbMobDrawer');
}

function closeMobDrawer() {
    ModalManager.close('dbMobDrawer');
}

// Global Listeners for Phase 1
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        // Save app choices before closing if the connector modal is open
        if (document.getElementById('dbAppConnectorOverlay')?.classList.contains('open') &&
            typeof window.saveAppChoices === 'function') {
            window.saveAppChoices();
        } else {
            ModalManager.closeAll();
        }
        if (typeof window.closeModal === 'function') window.closeModal(); // Support legacy auth modals
        if (typeof window.closeMobileMenu === 'function') window.closeMobileMenu(); // Support landing mobile menu
    }
});

// Sync backdrop click for drawers if they have their own
// Note: dashboard.html has inline onclick on backdrops, but we'll ensure they work.

// Export to window for global access (consistent with existing moshly-ui.js pattern)
window.ModalManager = ModalManager;
window.openProfileOverlay = openProfileOverlay;
window.closeProfileOverlay = closeProfileOverlay;
window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;
window.openProjectsManagerModal = openProjectsManagerModal;
window.closeProjectsManagerModal = closeProjectsManagerModal;
window.openAppConnectorModal = openAppConnectorModal;
window.closeAppConnectorModal = closeAppConnectorModal;
window.openAuditLogModal = openAuditLogModal;
window.closeAuditLogModal = closeAuditLogModal;
window.openMobDrawer = openMobDrawer;
window.closeMobDrawer = closeMobDrawer;
window.openProjectContextModal = openProjectContextModal;
window.closeProjectContextModal = closeProjectContextModal;
window.selectProjectType = selectProjectType;

// --- Profile Edit Logic (Restoring basic functionality) ---
function enableProfileEdit() {
    const viewFields = document.getElementById('dbProfileViewFields');
    const editFields = document.getElementById('dbProfileEditFields');
    const viewActions = document.getElementById('dbProfileActionsView');
    const editActions = document.getElementById('dbProfileActionsEdit');

    if (viewFields) viewFields.classList.add('db-hidden');
    if (viewActions) viewActions.classList.add('db-hidden');
    if (editFields) editFields.classList.remove('db-hidden');
    if (editActions) editActions.classList.remove('db-hidden');
    
    // Fill inputs with current values
    const firstNameVal = document.getElementById('dbPanelViewFirstName');
    const lastNameVal = document.getElementById('dbPanelViewLastName');
    const nameVal = document.getElementById('dbPanelViewName');
    const jobVal = document.getElementById('dbPanelViewJobTitle');
    const orgVal = document.getElementById('dbPanelViewOrg');
    const locVal = document.getElementById('dbPanelViewLocation');
    const skillsVal = document.getElementById('dbPanelViewSkills');

    if (firstNameVal && document.getElementById('dbEditFirstName')) document.getElementById('dbEditFirstName').value = firstNameVal.textContent.replace('—', '').trim();
    if (lastNameVal && document.getElementById('dbEditLastName')) document.getElementById('dbEditLastName').value = lastNameVal.textContent.replace('—', '').trim();
    if (nameVal && document.getElementById('dbEditName')) document.getElementById('dbEditName').value = nameVal.textContent.replace('—', '').trim();
    if (jobVal && document.getElementById('dbEditJobTitle')) document.getElementById('dbEditJobTitle').value = jobVal.textContent.replace('—', '').trim();
    if (orgVal && document.getElementById('dbEditOrg')) document.getElementById('dbEditOrg').value = orgVal.textContent.replace('—', '').trim();
    if (locVal && document.getElementById('dbEditLocation')) document.getElementById('dbEditLocation').value = locVal.textContent.replace('—', '').trim();
    if (skillsVal && document.getElementById('dbEditSkills')) document.getElementById('dbEditSkills').value = skillsVal.textContent.replace('—', '').trim();
}

function cancelProfileEdit() {
    const viewFields = document.getElementById('dbProfileViewFields');
    const editFields = document.getElementById('dbProfileEditFields');
    const viewActions = document.getElementById('dbProfileActionsView');
    const editActions = document.getElementById('dbProfileActionsEdit');

    if (viewFields) viewFields.classList.remove('db-hidden');
    if (viewActions) viewActions.classList.remove('db-hidden');
    if (editFields) editFields.classList.add('db-hidden');
    if (editActions) editActions.classList.add('db-hidden');
}

async function saveProfileChanges() {
    const btn = document.getElementById('dbProfileSaveBtn');
    if (!btn) return;
    const originalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const payload = {
        first_name: document.getElementById('dbEditFirstName')?.value || '',
        last_name: document.getElementById('dbEditLastName')?.value || '',
        name: document.getElementById('dbEditName')?.value || '',
        job_title: document.getElementById('dbEditJobTitle')?.value || '',
        org: document.getElementById('dbEditOrg')?.value || '',
        location: document.getElementById('dbEditLocation')?.value || '',
        skills: document.getElementById('dbEditSkills')?.value || ''
    };

    try {
        const { ok, data } = await window.MoshlyAuth.authFetch('/me', {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });

        if (ok) {
            // Update View Labels
            if (document.getElementById('dbPanelViewFirstName')) document.getElementById('dbPanelViewFirstName').textContent = payload.first_name || '—';
            if (document.getElementById('dbPanelViewLastName')) document.getElementById('dbPanelViewLastName').textContent = payload.last_name || '—';
            if (document.getElementById('dbPanelViewName')) document.getElementById('dbPanelViewName').textContent = payload.name || '—';
            if (document.getElementById('dbPanelViewJobTitle')) document.getElementById('dbPanelViewJobTitle').textContent = payload.job_title || '—';
            if (document.getElementById('dbPanelViewOrg')) document.getElementById('dbPanelViewOrg').textContent = payload.org || '—';
            if (document.getElementById('dbPanelViewLocation')) document.getElementById('dbPanelViewLocation').textContent = payload.location || '—';
            if (document.getElementById('dbPanelViewSkills')) document.getElementById('dbPanelViewSkills').textContent = payload.skills || '—';
            
            // Sync with dashboard views
            const firstName = payload.first_name || payload.name?.split(' ')[0] || document.getElementById('dbPanelEmail')?.textContent.split('@')[0] || '—';
            const displayName = payload.name || firstName || '—';
            document.querySelectorAll('.db-user-name, .db-mob-drawer-uname, #dbPanelName').forEach(el => el.textContent = displayName);
            const firstNameEl = document.getElementById('db-first-name');
            if (firstNameEl) firstNameEl.textContent = firstName;

            // Also update main dashboard view (if data-field exists)
            document.querySelectorAll('[data-field]').forEach(el => {
                const field = el.getAttribute('data-field');
                if (payload[field] !== undefined) {
                    el.textContent = payload[field] || '—';
                }
            });

            cancelProfileEdit();
        } else {
            const detail = data?.detail || data?.message || '';
            console.error('Profile save failed:', { status: ok, data });
            alert(detail ? `Failed to save profile: ${detail}` : 'Failed to save profile. Please try again.');
        }
    } catch (e) {
        console.error('Error saving profile:', e);
        alert('An error occurred. Check your connection.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

window.enableProfileEdit = enableProfileEdit;
window.cancelProfileEdit = cancelProfileEdit;
window.saveProfileChanges = saveProfileChanges;
