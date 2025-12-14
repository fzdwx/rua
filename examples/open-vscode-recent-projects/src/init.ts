/**
 * Open VSCode Recent Projects - Background Script
 *
 * Registers dynamic actions for each recent VSCode project.
 * When an action is selected, it opens the project in VSCode.
 */
import {BaseDirectory, createMainContextRuaAPI} from 'rua-api/browser';
import {DynamicAction} from "rua-api";

interface Storage {
    profileAssociations: {
        workspaces: Record<string, string>;
    };
}

interface ProjectItem {
    id: string;
    name: string;
    path: string;
}

// Store projects for action lookup
let projectsMap = new Map<string, ProjectItem>();

async function init() {
    const rua = createMainContextRuaAPI();

    /**
     * Open a project in VSCode
     */
    async function openWithVSCode(projectPath: string): Promise<void> {
        try {
            const result = await rua.shell.execute('code', [projectPath]);
            if (result.success) {
                console.log(`[${rua.extension.id}] Opened ${projectPath} in VSCode`);
            } else {
                console.error(`[${rua.extension.id}] Failed to open VSCode:`, result.stderr);
                await rua.notification.show({
                    title: 'Failed to open VSCode',
                    body: result.stderr || 'Unknown error',
                });
            }
        } catch (error) {
            console.error(`[${rua.extension.id}] Failed to execute code command:`, error);
            await rua.notification.show({
                title: 'Failed to open VSCode',
                body: 'Make sure the "code" command is installed in PATH',
            });
        }
    }

    /**
     * Load VSCode recent projects from storage.json
     */
    async function loadProjects(): Promise<ProjectItem[]> {
        const platform = await rua.os.platform();
        let fileContent: string | undefined;

        try {
            if (platform === 'darwin') {
                fileContent = await rua.fs.readTextFile(
                    'Library/Application Support/Code/User/globalStorage/storage.json',
                    {baseDir: BaseDirectory.Home}
                );
            } else if (platform === 'win32') {
                fileContent = await rua.fs.readTextFile(
                    'Code/User/globalStorage/storage.json',
                    {baseDir: BaseDirectory.AppData}
                );
            } else if (platform === 'linux') {
                fileContent = await rua.fs.readTextFile(
                    '.config/Code/User/globalStorage/storage.json',
                    {baseDir: BaseDirectory.Home}
                );
            } else {
                console.error(`[${rua.extension.id}] Unsupported platform: ${platform}`);
                return [];
            }
        } catch (error) {
            console.error(`[${rua.extension.id}] Failed to read VSCode storage file:`, error);
            return [];
        }

        if (!fileContent) {
            console.log("1231231")
            return [];
        }

        let jsonContent: Storage;
        try {
            jsonContent = JSON.parse(fileContent);
        } catch (error) {
            console.error(`[${rua.extension.id}] Failed to parse VSCode storage file:`, error);
            return [];
        }

        if (!jsonContent.profileAssociations?.workspaces) {
            return [];
        }

        // Extract workspace paths
        const workspacePaths = Object.keys(jsonContent.profileAssociations.workspaces)
            .filter((w) => w.startsWith('file://'))
            .map((w) => decodeURIComponent(w.slice(7))); // Remove 'file://' prefix and decode URI

        // Filter existing paths
        const existingPaths: string[] = [];
        for (const workspace of workspacePaths) {
            try {
                const exists = await rua.fs.exists(workspace);
                if (exists) {
                    existingPaths.push(workspace);
                }
            } catch (error) {
                // Ignore permission errors for paths outside allowed scope
                console.debug(`[${rua.extension.id}] Cannot check if ${workspace} exists:`, error);
            }
        }

        // Create project items with folder name as display name
        const projects: ProjectItem[] = [];
        for (const path of existingPaths) {
            const parts = path.split('/');
            const name = parts[parts.length - 1] || path;
            projects.push({
                id: `project-${projects.length}`,
                name,
                path,
            });
        }

        return projects;
    }

    console.log(`[${rua.extension.id}] Background script initialized!`);

    // Clean up on deactivate (optional)
    rua.on('deactivate', () => {
        console.log(`[${rua.extension.id}] Window deactivated`);
    });

    // Register actions on activate
    rua.on('activate', async () => {
        console.log(`[${rua.extension.id}] Window activated, loading projects...`);

        const projects = await loadProjects();
        console.log(`[${rua.extension.id}] Found ${projects.length} recent projects`);

        // Clear previous projects
        projectsMap.clear();

        // Register dynamic actions for each project
        const actions: DynamicAction[] = projects.map((project) => {
            projectsMap.set(project.id, project);
            return {
                id: project.id,
                name: `Code ${project.name}`,
                subtitle: project.path,
                // icon: 'ri:folder-open-fill',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" class="kk-ext-logo h-full w-full iconify iconify--vscode-icons" data-flip-id="kk-ext-logo-vscode" width="1em" height="1em" viewBox="0 0 32 32" style=""><path fill="#0065a9" d="m29.01 5.03l-5.766-2.776a1.74 1.74 0 0 0-1.989.338L2.38 19.8a1.166 1.166 0 0 0-.08 1.647q.037.04.077.077l1.541 1.4a1.165 1.165 0 0 0 1.489.066L28.142 5.75A1.158 1.158 0 0 1 30 6.672v-.067a1.75 1.75 0 0 0-.99-1.575"></path><path fill="#007acc" d="m29.01 26.97l-5.766 2.777a1.745 1.745 0 0 1-1.989-.338L2.38 12.2a1.166 1.166 0 0 1-.08-1.647q.037-.04.077-.077l1.541-1.4A1.165 1.165 0 0 1 5.41 9.01l22.732 17.24A1.158 1.158 0 0 0 30 25.328v.072a1.75 1.75 0 0 1-.99 1.57"></path><path fill="#1f9cf0" d="M23.244 29.747a1.745 1.745 0 0 1-1.989-.338A1.025 1.025 0 0 0 23 28.684V3.316a1.024 1.024 0 0 0-1.749-.724a1.74 1.74 0 0 1 1.989-.339l5.765 2.772A1.75 1.75 0 0 1 30 6.6v18.8a1.75 1.75 0 0 1-.991 1.576Z"></path><!----></svg>`,
                keywords: ['vscode', 'project', 'recent', project.name.toLowerCase()],
                mode: 'command' as const,
            };
        });

        if (actions.length > 0) {
            await rua.actions.register(actions);
            console.log(`[${rua.extension.id}] Registered ${actions.length} project actions`);
        }
    });

    // Handle action triggered
    rua.on('action-triggered', async (data: { actionId: string; context?: unknown }) => {
        console.log(`[${rua.extension.id}] Action triggered:`, data.actionId);

        const project = projectsMap.get(data.actionId);
        if (project) {
            await openWithVSCode(project.path);
        } else {
            console.warn(`[${rua.extension.id}] Unknown action:`, data.actionId);
        }
    });
}

init()

