/**
 * Open VSCode Recent Projects - Background Script
 *
 * Registers dynamic actions for each recent VSCode project.
 * When an action is selected, it opens the project in VSCode.
 */
import { BaseDirectory, createMainContextRuaAPI } from 'rua-api/browser';

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

const rua = createMainContextRuaAPI();
console.log(`[${rua.extension.id}] Background script initialized!`);

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
                { baseDir: BaseDirectory.Home }
            );
        } else if (platform === 'win32') {
            fileContent = await rua.fs.readTextFile(
                'Code/User/globalStorage/storage.json',
                { baseDir: BaseDirectory.AppData }
            );
        } else if (platform === 'linux') {
            fileContent = await rua.fs.readTextFile(
                '.config/Code/User/globalStorage/storage.json',
                { baseDir: BaseDirectory.Home }
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

// Store projects for action lookup
let projectsMap = new Map<string, ProjectItem>();

// Register actions on activate
rua.on('activate', async () => {
    console.log(`[${rua.extension.id}] Window activated, loading projects...`);

    const projects = await loadProjects();
    console.log(`[${rua.extension.id}] Found ${projects.length} recent projects`);

    // Clear previous projects
    projectsMap.clear();

    // Register dynamic actions for each project
    const actions = projects.map((project) => {
        projectsMap.set(project.id, project);
        return {
            id: project.id,
            name: project.name,
            subtitle: project.path,
            icon: 'ri:folder-open-fill',
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

// Clean up on deactivate (optional)
rua.on('deactivate', () => {
    console.log(`[${rua.extension.id}] Window deactivated`);
});
