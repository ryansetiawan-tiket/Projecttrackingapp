import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Initialize Supabase client (needed for auth and storage)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Initialize default type colors and types list
const initializeTypeColors = async () => {
  try {
    console.log('[Init] Starting type colors initialization...');
    const existingColors = await kv.get('type_colors');
    console.log('[Init] Existing type colors:', existingColors ? 'found' : 'not found');
    
    if (!existingColors) {
      const defaultTypeColors = {
        'Spot': '#ff6b6b',
        'Icon': '#4ecdc4', 
        'Micro': '#45b7d1',
        'Banner': '#96ceb4',
        'Other': '#feca57',
        'Product Icon': '#ff9ff3',
        'Micro Interaction': '#54a0ff',
        'DLP': '#5f27cd',
        'Pop Up': '#00d2d3'
      };
      await kv.set('type_colors', JSON.stringify(defaultTypeColors));
      await kv.set('type_list', JSON.stringify(Object.keys(defaultTypeColors)));
      console.log('[Init] Initialized default type colors and types list successfully');
    } else {
      console.log('[Init] Type colors already initialized');
    }
  } catch (error) {
    console.error('[Init] Failed to initialize type colors:', error);
    console.error('[Init] Error details:', error instanceof Error ? error.message : String(error));
    // Don't throw - let server continue to start
  }
};

// Initialize default vertical colors
const initializeVerticalColors = async () => {
  try {
    console.log('[Init] Starting vertical colors initialization...');
    const existingColors = await kv.get('vertical_colors');
    console.log('[Init] Existing vertical colors:', existingColors ? 'found' : 'not found');
    
    if (!existingColors) {
      const defaultVerticalColors = {
        'LOYALTY': '#fef3c7',
        'ORDER': '#fecaca',
        'WISHLIST': '#e9d5ff',
        'CSF': '#bfdbfe',
        'PAYMENT': '#bbf7d0',
        'PRODUCT': '#fed7aa',
        'MARKETING': '#fbcfe8',
        'LOYALTY & ACQUISITION': '#fef3c7'
      };
      await kv.set('vertical_colors', JSON.stringify(defaultVerticalColors));
      await kv.set('vertical_list', JSON.stringify(Object.keys(defaultVerticalColors)));
      console.log('[Init] Initialized default vertical colors successfully');
    } else {
      console.log('[Init] Vertical colors already initialized');
    }
  } catch (error) {
    console.error('[Init] Failed to initialize vertical colors:', error);
    console.error('[Init] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[Init] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    // Don't throw - let server continue to start
  }
};

// Initialize default roles
const initializeRoles = async () => {
  try {
    console.log('[Init] Starting roles initialization...');
    const existingRoles = await kv.get('role_list');
    console.log('[Init] Existing roles:', existingRoles ? 'found' : 'not found');
    
    if (!existingRoles) {
      const defaultRoles = [
        'Illustrator', 'UI Designer', 'UX Designer', 'Graphic Designer',
        'Creative Director', 'Project Manager', 'Art Director'
      ];
      await kv.set('role_list', JSON.stringify(defaultRoles));
      console.log('[Init] Initialized default roles successfully');
    } else {
      console.log('[Init] Roles already initialized');
    }
  } catch (error) {
    console.error('[Init] Failed to initialize roles:', error);
    console.error('[Init] Error details:', error instanceof Error ? error.message : String(error));
    // Don't throw - let server continue to start
  }
};

// Initialize on server start (run sequentially with error handling)
const initializeServer = async () => {
  console.log('[Server] Starting initialization...');
  try {
    await initializeTypeColors();
    await initializeVerticalColors();
    await initializeRoles();
    console.log('[Server] All initializations completed successfully');
  } catch (error) {
    console.error('[Server] Initialization error:', error);
    console.error('[Server] Server will continue despite initialization errors');
  }
};

// Run initialization (don't await to avoid blocking server start)
initializeServer().catch(err => {
  console.error('[Server] Fatal initialization error:', err);
});

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-691c6bba/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all projects
app.get("/make-server-691c6bba/projects", async (c) => {
  try {
    console.log("[Server] GET /projects - Fetching all projects");
    const projects = await kv.getByPrefix("project:");
    console.log("[Server] Found", projects?.length || 0, "projects");
    
    // Log draft projects specifically
    const draftProjects = projects?.filter((p: any) => p.is_draft) || [];
    console.log("[Server] Draft projects count:", draftProjects.length);
    if (draftProjects.length > 0) {
      console.log("[Server] Draft projects:", draftProjects.map((p: any) => ({ id: p.id, name: p.project_name, is_draft: p.is_draft })));
    }
    
    return c.json({ projects: projects || [] });
  } catch (error) {
    console.log("Error fetching projects:", error);
    return c.json({ error: "Failed to fetch projects" }, 500);
  }
});

// Get single project
app.get("/make-server-691c6bba/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }
    return c.json({ project });
  } catch (error) {
    console.log("Error fetching project:", error);
    return c.json({ error: "Failed to fetch project" }, 500);
  }
});

// Create new project
app.post("/make-server-691c6bba/projects", async (c) => {
  try {
    const body = await c.req.json();
    console.log("[Server] POST /projects - Request body:", body);
    console.log("[Server] is_draft in request:", body.is_draft);
    
    const projectId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const project = {
      id: projectId,
      project_name: body.project_name,
      vertical: body.vertical || "",
      type: body.type || "",
      types: body.types || [],
      tags: body.tags || [],
      status: body.status || "Not Started",
      description: body.description || "",
      start_date: body.start_date || "",
      due_date: body.due_date || "",
      links: body.links || {},
      collaborators: body.collaborators || [],
      sprint: body.sprint || "",
      figma_working_file: body.figma_working_file || "",
      actionable_items: body.actionable_items || [],
      lightroom_assets: body.lightroom_assets || [],
      gdrive_assets: body.gdrive_assets || [],
      is_draft: body.is_draft || false,
      created_at: now,
      updated_at: now
    };
    
    console.log("[Server] Created project object:", project);
    console.log("[Server] is_draft in created project:", project.is_draft);
    
    await kv.set(`project:${projectId}`, project);
    console.log("[Server] Project saved to KV store");
    
    return c.json({ project }, 201);
  } catch (error) {
    console.log("Error creating project:", error);
    return c.json({ error: "Failed to create project" }, 500);
  }
});

// Update project
app.put("/make-server-691c6bba/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const existingProject = await kv.get(`project:${id}`);
    
    if (!existingProject) {
      return c.json({ error: "Project not found" }, 404);
    }

    const updatedProject = {
      ...existingProject,
      ...body,
      id: id,
      updated_at: new Date().toISOString()
    };

    await kv.set(`project:${id}`, updatedProject);
    return c.json({ project: updatedProject });
  } catch (error) {
    console.log("Error updating project:", error);
    return c.json({ error: "Failed to update project" }, 500);
  }
});

// Delete project
app.delete("/make-server-691c6bba/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existingProject = await kv.get(`project:${id}`);
    
    if (!existingProject) {
      return c.json({ error: "Project not found" }, 404);
    }

    await kv.del(`project:${id}`);
    return c.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.log("Error deleting project:", error);
    return c.json({ error: "Failed to delete project" }, 500);
  }
});

// Get all collaborators
app.get("/make-server-691c6bba/collaborators", async (c) => {
  try {
    const collaborators = await kv.getByPrefix("collaborator:");
    return c.json({ collaborators: collaborators || [] });
  } catch (error) {
    console.log("Error fetching collaborators:", error);
    return c.json({ error: "Failed to fetch collaborators" }, 500);
  }
});

// Create collaborator
app.post("/make-server-691c6bba/collaborators", async (c) => {
  try {
    const body = await c.req.json();
    const collaboratorId = crypto.randomUUID();
    
    const collaborator = {
      id: collaboratorId,
      name: body.name,
      nickname: body.nickname || undefined,
      email: body.email || "",
      role: body.role || "",
      photo_url: body.photo_url || undefined,
      profile_url: body.profile_url || undefined
    };

    await kv.set(`collaborator:${collaboratorId}`, collaborator);
    return c.json({ collaborator }, 201);
  } catch (error) {
    console.log("Error creating collaborator:", error);
    return c.json({ error: "Failed to create collaborator" }, 500);
  }
});

// Update collaborator
app.put("/make-server-691c6bba/collaborators/:id", async (c) => {
  try {
    const collaboratorId = c.req.param("id");
    const body = await c.req.json();
    
    // Check if collaborator exists
    const existingCollaborator = await kv.get(`collaborator:${collaboratorId}`);
    if (!existingCollaborator) {
      return c.json({ error: "Collaborator not found" }, 404);
    }
    
    const updatedCollaborator = {
      ...existingCollaborator,
      name: body.name !== undefined ? body.name : existingCollaborator.name,
      nickname: body.nickname !== undefined ? body.nickname : existingCollaborator.nickname,
      email: body.email !== undefined ? body.email : existingCollaborator.email,
      role: body.role !== undefined ? body.role : existingCollaborator.role,
      photo_url: body.photo_url !== undefined ? body.photo_url : existingCollaborator.photo_url,
      profile_url: body.profile_url !== undefined ? body.profile_url : existingCollaborator.profile_url
    };
    
    await kv.set(`collaborator:${collaboratorId}`, updatedCollaborator);
    
    // Update collaborator in all projects
    const projects = await kv.getByPrefix("project:");
    for (const project of projects) {
      if (project.collaborators && project.collaborators.some(c => String(c.id) === String(collaboratorId))) {
        project.collaborators = project.collaborators.map(c => 
          String(c.id) === String(collaboratorId) 
            ? {
                id: c.id,
                name: updatedCollaborator.name,
                nickname: updatedCollaborator.nickname,
                role: updatedCollaborator.role,
                photo_url: updatedCollaborator.photo_url,
                profile_url: updatedCollaborator.profile_url
              }
            : c
        );
        await kv.set(`project:${project.id}`, project);
      }
    }
    
    return c.json({ collaborator: updatedCollaborator });
  } catch (error) {
    console.log("Error updating collaborator:", error);
    return c.json({ error: "Failed to update collaborator" }, 500);
  }
});

// Delete collaborator
app.delete("/make-server-691c6bba/collaborators/:id", async (c) => {
  try {
    const collaboratorId = c.req.param("id");
    
    // Check if collaborator exists
    const collaborator = await kv.get(`collaborator:${collaboratorId}`);
    if (!collaborator) {
      return c.json({ error: "Collaborator not found" }, 404);
    }
    
    // Check if collaborator is being used in any project
    const projects = await kv.getByPrefix("project:");
    const collaboratorInUse = projects.some(project => 
      project.collaborators && project.collaborators.some(c => String(c.id) === String(collaboratorId))
    );
    
    if (collaboratorInUse) {
      return c.json({ error: "Cannot delete collaborator that is assigned to projects" }, 400);
    }
    
    // Delete the collaborator
    await kv.del(`collaborator:${collaboratorId}`);
    return c.json({ message: "Collaborator deleted successfully" });
  } catch (error) {
    console.log("Error deleting collaborator:", error);
    return c.json({ error: "Failed to delete collaborator" }, 500);
  }
});

// Get type colors
app.get("/make-server-691c6bba/type-colors", async (c) => {
  try {
    const colors = await kv.get('type_colors');
    const defaultColors = {
      'Spot': '#ff6b6b',
      'Icon': '#4ecdc4', 
      'Micro': '#45b7d1',
      'Banner': '#96ceb4',
      'Other': '#feca57',
      'Product Icon': '#ff9ff3',
      'Micro Interaction': '#54a0ff',
      'DLP': '#5f27cd',
      'Pop Up': '#00d2d3'
    };
    return c.json({ colors: colors ? JSON.parse(colors) : defaultColors });
  } catch (error) {
    console.error("[API] Error fetching type colors:", error);
    // Return default colors instead of error
    const defaultColors = {
      'Spot': '#ff6b6b',
      'Icon': '#4ecdc4', 
      'Micro': '#45b7d1',
      'Banner': '#96ceb4',
      'Other': '#feca57',
      'Product Icon': '#ff9ff3',
      'Micro Interaction': '#54a0ff',
      'DLP': '#5f27cd',
      'Pop Up': '#00d2d3'
    };
    return c.json({ colors: defaultColors });
  }
});

// Update type color
app.put("/make-server-691c6bba/type-colors/:type", async (c) => {
  try {
    const type = c.req.param("type");
    const body = await c.req.json();
    const { color } = body;
    
    const existingColors = await kv.get('type_colors');
    const colors = existingColors ? JSON.parse(existingColors) : {};
    colors[type] = color;
    
    await kv.set('type_colors', JSON.stringify(colors));
    return c.json({ colors });
  } catch (error) {
    console.log("Error updating type color:", error);
    return c.json({ error: "Failed to update type color" }, 500);
  }
});

// Get vertical colors
app.get("/make-server-691c6bba/vertical-colors", async (c) => {
  try {
    const colors = await kv.get('vertical_colors');
    const defaultColors = {
      'LOYALTY': '#fef3c7',
      'ORDER': '#fecaca',
      'WISHLIST': '#e9d5ff',
      'CSF': '#bfdbfe',
      'PAYMENT': '#bbf7d0',
      'PRODUCT': '#fed7aa',
      'MARKETING': '#fbcfe8',
      'LOYALTY & ACQUISITION': '#fef3c7'
    };
    return c.json({ colors: colors ? JSON.parse(colors) : defaultColors });
  } catch (error) {
    console.error("[API] Error fetching vertical colors:", error);
    // Return default colors instead of error
    const defaultColors = {
      'LOYALTY': '#fef3c7',
      'ORDER': '#fecaca',
      'WISHLIST': '#e9d5ff',
      'CSF': '#bfdbfe',
      'PAYMENT': '#bbf7d0',
      'PRODUCT': '#fed7aa',
      'MARKETING': '#fbcfe8',
      'LOYALTY & ACQUISITION': '#fef3c7'
    };
    return c.json({ colors: defaultColors });
  }
});

// Update vertical color
app.put("/make-server-691c6bba/vertical-colors/:vertical", async (c) => {
  try {
    const vertical = c.req.param("vertical");
    const body = await c.req.json();
    const { color } = body;
    
    const existingColors = await kv.get('vertical_colors');
    const colors = existingColors ? JSON.parse(existingColors) : {};
    colors[vertical] = color;
    
    await kv.set('vertical_colors', JSON.stringify(colors));
    
    // Update the vertical list if it's a new vertical
    const existingVerticals = await kv.get('vertical_list');
    const verticals = existingVerticals ? JSON.parse(existingVerticals) : [];
    if (!verticals.includes(vertical)) {
      verticals.push(vertical);
      await kv.set('vertical_list', JSON.stringify(verticals));
    }
    
    return c.json({ colors });
  } catch (error) {
    console.log("Error updating vertical color:", error);
    return c.json({ error: "Failed to update vertical color" }, 500);
  }
});

// Get all verticals
app.get("/make-server-691c6bba/verticals", async (c) => {
  try {
    const verticals = await kv.get('vertical_list');
    const defaultVerticals = ['LOYALTY', 'ORDER', 'WISHLIST', 'CSF', 'PAYMENT', 'PRODUCT', 'MARKETING', 'LOYALTY & ACQUISITION'];
    return c.json({ verticals: verticals ? JSON.parse(verticals) : defaultVerticals });
  } catch (error) {
    console.error("[API] Error fetching verticals:", error);
    // Return default verticals instead of error
    const defaultVerticals = ['LOYALTY', 'ORDER', 'WISHLIST', 'CSF', 'PAYMENT', 'PRODUCT', 'MARKETING', 'LOYALTY & ACQUISITION'];
    return c.json({ verticals: defaultVerticals });
  }
});

// Rename vertical - MORE SPECIFIC ROUTE FIRST
app.patch("/make-server-691c6bba/verticals/:vertical/rename", async (c) => {
  try {
    const oldVertical = decodeURIComponent(c.req.param("vertical"));
    const body = await c.req.json();
    const { newName } = body;
    
    console.log("Rename vertical request:", { oldVertical, newName });
    
    if (!newName || typeof newName !== 'string') {
      return c.json({ error: "New vertical name is required" }, 400);
    }
    
    const newVerticalName = newName.toUpperCase();
    
    // Check if new name already exists
    const existingVerticals = await kv.get('vertical_list');
    const verticals = existingVerticals ? JSON.parse(existingVerticals) : [];
    
    if (verticals.includes(newVerticalName) && newVerticalName !== oldVertical) {
      return c.json({ error: "Vertical with this name already exists" }, 400);
    }
    
    // Update vertical in the list
    const updatedVerticals = verticals.map(v => v === oldVertical ? newVerticalName : v);
    await kv.set('vertical_list', JSON.stringify(updatedVerticals));
    
    // Update color mapping
    const existingColors = await kv.get('vertical_colors');
    const colors = existingColors ? JSON.parse(existingColors) : {};
    if (colors[oldVertical]) {
      colors[newVerticalName] = colors[oldVertical];
      delete colors[oldVertical];
      await kv.set('vertical_colors', JSON.stringify(colors));
    }
    
    // Update all projects that use this vertical
    const projects = await kv.getByPrefix("project:");
    for (const project of projects) {
      if (project.vertical === oldVertical) {
        await kv.set(`project:${project.id}`, {
          ...project,
          vertical: newVerticalName,
          updated_at: new Date().toISOString()
        });
      }
    }
    
    console.log("Vertical renamed successfully from", oldVertical, "to", newVerticalName);
    return c.json({ message: "Vertical renamed successfully", newName: newVerticalName });
  } catch (error) {
    console.log("Error renaming vertical:", error);
    return c.json({ error: "Failed to rename vertical" }, 500);
  }
});

// Delete vertical
app.delete("/make-server-691c6bba/vertical-colors/:vertical", async (c) => {
  try {
    const vertical = c.req.param("vertical");
    
    // Check if vertical is being used in any project
    const projects = await kv.getByPrefix("project:");
    const verticalInUse = projects.some(project => 
      project.vertical === vertical
    );
    
    if (verticalInUse) {
      return c.json({ error: "Cannot delete vertical that is assigned to projects" }, 400);
    }
    
    // Remove from vertical list
    const existingVerticals = await kv.get('vertical_list');
    const verticals = existingVerticals ? JSON.parse(existingVerticals) : [];
    const updatedVerticals = verticals.filter(v => v !== vertical);
    await kv.set('vertical_list', JSON.stringify(updatedVerticals));
    
    // Remove from vertical colors
    const existingColors = await kv.get('vertical_colors');
    const colors = existingColors ? JSON.parse(existingColors) : {};
    delete colors[vertical];
    await kv.set('vertical_colors', JSON.stringify(colors));
    
    return c.json({ message: "Vertical deleted successfully" });
  } catch (error) {
    console.log("Error deleting vertical:", error);
    return c.json({ error: "Failed to delete vertical" }, 500);
  }
});

// Get all roles
app.get("/make-server-691c6bba/roles", async (c) => {
  try {
    const roles = await kv.get('role_list');
    const defaultRoles = [
      'Illustrator', 'UI Designer', 'UX Designer', 'Graphic Designer',
      'Creative Director', 'Project Manager', 'Art Director'
    ];
    return c.json({ roles: roles ? JSON.parse(roles) : defaultRoles });
  } catch (error) {
    console.error("[API] Error fetching roles:", error);
    // Return default roles instead of error
    const defaultRoles = [
      'Illustrator', 'UI Designer', 'UX Designer', 'Graphic Designer',
      'Creative Director', 'Project Manager', 'Art Director'
    ];
    return c.json({ roles: defaultRoles });
  }
});

// Add new role
app.post("/make-server-691c6bba/roles", async (c) => {
  try {
    const body = await c.req.json();
    const { role } = body;
    
    if (!role || typeof role !== 'string') {
      return c.json({ error: "Role name is required" }, 400);
    }
    
    const existingRoles = await kv.get('role_list');
    const roles = existingRoles ? JSON.parse(existingRoles) : [
      'Illustrator', 'UI Designer', 'UX Designer', 'Graphic Designer',
      'Creative Director', 'Project Manager', 'Art Director'
    ];
    
    if (roles.includes(role)) {
      return c.json({ error: "Role already exists" }, 400);
    }
    
    roles.push(role);
    await kv.set('role_list', JSON.stringify(roles));
    
    return c.json({ roles }, 201);
  } catch (error) {
    console.log("Error adding role:", error);
    return c.json({ error: "Failed to add role" }, 500);
  }
});

// Delete role
app.delete("/make-server-691c6bba/roles/:role", async (c) => {
  try {
    const roleToDelete = c.req.param("role");
    
    // Check if role is in use by any collaborator
    const collaborators = await kv.getByPrefix("collaborator:");
    const roleInUse = collaborators.some(collaborator => collaborator.role === roleToDelete);
    
    if (roleInUse) {
      return c.json({ error: "Cannot delete role that is currently in use" }, 400);
    }
    
    const existingRoles = await kv.get('role_list');
    const roles = existingRoles ? JSON.parse(existingRoles) : [];
    
    const updatedRoles = roles.filter(role => role !== roleToDelete);
    await kv.set('role_list', JSON.stringify(updatedRoles));
    
    return c.json({ roles: updatedRoles });
  } catch (error) {
    console.log("Error deleting role:", error);
    return c.json({ error: "Failed to delete role" }, 500);
  }
});

// Update/rename role
app.put("/make-server-691c6bba/roles/:role", async (c) => {
  try {
    const oldRole = c.req.param("role");
    const body = await c.req.json();
    const { newRole } = body;
    
    if (!newRole || typeof newRole !== 'string') {
      return c.json({ error: "New role name is required" }, 400);
    }
    
    // Get existing roles
    const existingRoles = await kv.get('role_list');
    const roles = existingRoles ? JSON.parse(existingRoles) : [];
    
    // Check if old role exists
    if (!roles.includes(oldRole)) {
      return c.json({ error: "Role not found" }, 404);
    }
    
    // Check if new role name already exists (and is different from old)
    if (newRole !== oldRole && roles.includes(newRole)) {
      return c.json({ error: "A role with that name already exists" }, 400);
    }
    
    // If name hasn't changed, just return success
    if (newRole === oldRole) {
      return c.json({ roles });
    }
    
    // Update role in role_list
    const updatedRoles = roles.map(role => role === oldRole ? newRole : role);
    await kv.set('role_list', JSON.stringify(updatedRoles));
    
    // Update all collaborators that have this role
    const collaborators = await kv.getByPrefix("collaborator:");
    for (const collaborator of collaborators) {
      if (collaborator.role === oldRole) {
        const updatedCollaborator = { ...collaborator, role: newRole };
        await kv.set(`collaborator:${collaborator.id}`, updatedCollaborator);
      }
    }
    
    // 🎯 CRITICAL FIX: Update embedded collaborators in all projects
    console.log(`[Roles] Updating role in all projects from "${oldRole}" to "${newRole}"`);
    const projects = await kv.getByPrefix("project:");
    for (const project of projects) {
      // Check if project has collaborators with the old role
      if (project.collaborators && Array.isArray(project.collaborators)) {
        const hasOldRole = project.collaborators.some(c => c.role === oldRole);
        
        if (hasOldRole) {
          // Update role for matching collaborators
          const updatedCollaborators = project.collaborators.map(c => 
            c.role === oldRole ? { ...c, role: newRole } : c
          );
          
          await kv.set(`project:${project.id}`, {
            ...project,
            collaborators: updatedCollaborators,
            updated_at: new Date().toISOString()
          });
          
          console.log(`[Roles] Updated collaborators in project: ${project.project_name}`);
        }
      }
    }
    console.log(`[Roles] Role rename complete!`);
    
    return c.json({ roles: updatedRoles });
  } catch (error) {
    console.log("Error updating role:", error);
    return c.json({ error: "Failed to update role" }, 500);
  }
});

// Get all illustration types
app.get("/make-server-691c6bba/types", async (c) => {
  try {
    const types = await kv.get('type_list');
    const colors = await kv.get('type_colors');
    const metadata = await kv.get('type_metadata'); // NEW: Store full type metadata
    
    const typeList = types ? JSON.parse(types) : [
      'Spot', 'Icon', 'Micro', 'Banner', 'Other', 
      'Product Icon', 'Micro Interaction', 'DLP', 'Pop Up'
    ];
    
    // Default colors for types
    const defaultTypeColors = {
      'Spot': '#ff6b6b',
      'Icon': '#4ecdc4', 
      'Micro': '#45b7d1',
      'Banner': '#f9ca24',
      'Other': '#f0932b',
      'Product Icon': '#eb4d4b',
      'Micro Interaction': '#6c5ce7',
      'DLP': '#a55eea',
      'Pop Up': '#26de81'
    };
    
    const typeColors = colors ? JSON.parse(colors) : defaultTypeColors;
    const typeMetadata = metadata ? JSON.parse(metadata) : {}; // Metadata stores {typeName: {textColor, useAutoContrast}}
    
    // Initialize default data if not exists
    if (!types) {
      await kv.set('type_list', JSON.stringify(typeList));
    }
    if (!colors) {
      await kv.set('type_colors', JSON.stringify(typeColors));
    }
    
    // Build full types with colors array for frontend
    const typesWithColors = typeList.map(typeName => ({
      name: typeName,
      color: typeColors[typeName] || '#6b7280',
      textColor: typeMetadata[typeName]?.textColor,
      useAutoContrast: typeMetadata[typeName]?.useAutoContrast ?? true
    }));
    
    return c.json({ 
      types: typeList,
      colors: typeColors,
      typesWithColors // NEW: Full type data with text color info
    });
  } catch (error) {
    console.log("Error fetching types:", error);
    return c.json({ error: "Failed to fetch types" }, 500);
  }
});

// Add new illustration type
app.post("/make-server-691c6bba/types", async (c) => {
  try {
    const body = await c.req.json();
    const { type, color, textColor, useAutoContrast } = body;
    
    if (!type || typeof type !== 'string') {
      return c.json({ error: "Type name is required" }, 400);
    }
    
    if (!color || typeof color !== 'string') {
      return c.json({ error: "Type color is required" }, 400);
    }
    
    // Get existing types, colors, and metadata
    const existingTypes = await kv.get('type_list');
    const existingColors = await kv.get('type_colors');
    const existingMetadata = await kv.get('type_metadata');
    
    const types = existingTypes ? JSON.parse(existingTypes) : [];
    const colors = existingColors ? JSON.parse(existingColors) : {};
    const metadata = existingMetadata ? JSON.parse(existingMetadata) : {};
    
    if (types.includes(type)) {
      return c.json({ error: "Type already exists" }, 400);
    }
    
    // Add new type, color, and metadata
    types.push(type);
    colors[type] = color;
    if (textColor || useAutoContrast !== undefined) {
      metadata[type] = {
        textColor,
        useAutoContrast: useAutoContrast ?? true
      };
    }
    
    await kv.set('type_list', JSON.stringify(types));
    await kv.set('type_colors', JSON.stringify(colors));
    await kv.set('type_metadata', JSON.stringify(metadata));
    
    return c.json({ 
      types,
      colors,
      message: "Type added successfully"
    }, 201);
  } catch (error) {
    console.log("Error adding type:", error);
    return c.json({ error: "Failed to add type" }, 500);
  }
});

// Update illustration type (rename and/or change color)
app.put("/make-server-691c6bba/types/:type", async (c) => {
  try {
    const oldType = c.req.param("type");
    const body = await c.req.json();
    const { newType, color, textColor, useAutoContrast } = body;
    
    // Get existing types, colors, and metadata
    const existingTypes = await kv.get('type_list');
    const existingColors = await kv.get('type_colors');
    const existingMetadata = await kv.get('type_metadata');
    
    const types = existingTypes ? JSON.parse(existingTypes) : [];
    const colors = existingColors ? JSON.parse(existingColors) : {};
    const metadata = existingMetadata ? JSON.parse(existingMetadata) : {};
    
    if (!types.includes(oldType)) {
      return c.json({ error: "Type not found" }, 404);
    }
    
    // If renaming the type
    if (newType && newType !== oldType) {
      if (types.includes(newType)) {
        return c.json({ error: "New type name already exists" }, 400);
      }
      
      // Update type list
      const typeIndex = types.indexOf(oldType);
      types[typeIndex] = newType;
      
      // Update colors mapping
      colors[newType] = color || colors[oldType];
      delete colors[oldType];
      
      // Update metadata mapping
      if (metadata[oldType]) {
        metadata[newType] = metadata[oldType];
        delete metadata[oldType];
      }
      if (textColor !== undefined || useAutoContrast !== undefined) {
        metadata[newType] = {
          ...(metadata[newType] || {}),
          ...(textColor !== undefined && { textColor }),
          ...(useAutoContrast !== undefined && { useAutoContrast })
        };
      }
      
      // Update all projects that use this type
      const projects = await kv.getByPrefix("project:");
      for (const project of projects) {
        let updated = false;
        
        // Update single type field
        if (project.type === oldType) {
          project.type = newType;
          updated = true;
        }
        
        // Update types array
        if (project.types && Array.isArray(project.types)) {
          const typeIndex = project.types.indexOf(oldType);
          if (typeIndex !== -1) {
            project.types[typeIndex] = newType;
            updated = true;
          }
        }
        
        if (updated) {
          project.updated_at = new Date().toISOString();
          await kv.set(`project:${project.id}`, project);
        }
      }
    } else {
      // Just updating color and/or text color settings
      if (color) {
        colors[oldType] = color;
      }
      if (textColor !== undefined || useAutoContrast !== undefined) {
        metadata[oldType] = {
          ...(metadata[oldType] || {}),
          ...(textColor !== undefined && { textColor }),
          ...(useAutoContrast !== undefined && { useAutoContrast })
        };
      }
    }
    
    await kv.set('type_list', JSON.stringify(types));
    await kv.set('type_colors', JSON.stringify(colors));
    await kv.set('type_metadata', JSON.stringify(metadata));
    
    return c.json({ 
      types,
      colors,
      message: "Type updated successfully"
    });
  } catch (error) {
    console.log("Error updating type:", error);
    return c.json({ error: "Failed to update type" }, 500);
  }
});

// Delete illustration type
app.delete("/make-server-691c6bba/types/:type", async (c) => {
  try {
    const typeToDelete = c.req.param("type");
    
    // Check if type is in use by any project
    const projects = await kv.getByPrefix("project:");
    const typeInUse = projects.some(project => 
      project.type === typeToDelete || 
      (project.types && Array.isArray(project.types) && project.types.includes(typeToDelete))
    );
    
    if (typeInUse) {
      return c.json({ error: "Cannot delete type that is currently used in projects" }, 400);
    }
    
    // Get existing types and colors
    const existingTypes = await kv.get('type_list');
    const existingColors = await kv.get('type_colors');
    
    const types = existingTypes ? JSON.parse(existingTypes) : [];
    const colors = existingColors ? JSON.parse(existingColors) : {};
    
    // Remove from both arrays
    const updatedTypes = types.filter(type => type !== typeToDelete);
    delete colors[typeToDelete];
    
    await kv.set('type_list', JSON.stringify(updatedTypes));
    await kv.set('type_colors', JSON.stringify(colors));
    
    return c.json({ 
      types: updatedTypes,
      colors,
      message: "Type deleted successfully"
    });
  } catch (error) {
    console.log("Error deleting type:", error);
    return c.json({ error: "Failed to delete type" }, 500);
  }
});

// ========== Link Labels Management ==========

// Get all link labels
app.get("/make-server-691c6bba/link-labels", async (c) => {
  try {
    const linkLabels = await kv.getByPrefix("link_label:");
    return c.json({ linkLabels: linkLabels || [] });
  } catch (error) {
    console.log("Error fetching link labels:", error);
    return c.json({ error: "Failed to fetch link labels" }, 500);
  }
});

// Create new link label
app.post("/make-server-691c6bba/link-labels", async (c) => {
  try {
    const body = await c.req.json();
    const linkLabelId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const linkLabel = {
      id: linkLabelId,
      label: body.label,
      icon_type: body.icon_type || 'text',
      icon_value: body.icon_value || '',
      placeholder: body.placeholder || `Enter ${body.label.toLowerCase()} URL`,
      created_at: now,
      updated_at: now
    };

    await kv.set(`link_label:${linkLabelId}`, linkLabel);
    return c.json({ linkLabel }, 201);
  } catch (error) {
    console.log("Error creating link label:", error);
    return c.json({ error: "Failed to create link label" }, 500);
  }
});

// Update link label
app.put("/make-server-691c6bba/link-labels/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const existingLabel = await kv.get(`link_label:${id}`);
    
    if (!existingLabel) {
      return c.json({ error: "Link label not found" }, 404);
    }

    const updatedLabel = {
      ...existingLabel,
      ...body,
      id: id,
      updated_at: new Date().toISOString()
    };

    await kv.set(`link_label:${id}`, updatedLabel);
    return c.json({ linkLabel: updatedLabel });
  } catch (error) {
    console.log("Error updating link label:", error);
    return c.json({ error: "Failed to update link label" }, 500);
  }
});

// Delete link label
app.delete("/make-server-691c6bba/link-labels/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existingLabel = await kv.get(`link_label:${id}`);
    
    if (!existingLabel) {
      return c.json({ error: "Link label not found" }, 404);
    }

    await kv.del(`link_label:${id}`);
    return c.json({ message: "Link label deleted successfully" });
  } catch (error) {
    console.log("Error deleting link label:", error);
    return c.json({ error: "Failed to delete link label" }, 500);
  }
});

// ========== Team Management Routes ==========

// Get all teams
app.get("/make-server-691c6bba/teams", async (c) => {
  try {
    const teams = await kv.getByPrefix("team:");
    return c.json({ teams: teams || [] });
  } catch (error) {
    console.log("Error fetching teams:", error);
    return c.json({ error: "Failed to fetch teams" }, 500);
  }
});

// Create new team
app.post("/make-server-691c6bba/teams", async (c) => {
  try {
    const body = await c.req.json();
    const teamId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const team = {
      id: teamId,
      name: body.name,
      vertical: body.vertical,
      memberIds: body.memberIds || [],
      subteams: [],
      createdAt: now,
      updatedAt: now
    };

    await kv.set(`team:${teamId}`, team);
    return c.json({ team }, 201);
  } catch (error) {
    console.log("Error creating team:", error);
    return c.json({ error: "Failed to create team" }, 500);
  }
});

// Update team (name, vertical, and/or members)
app.patch("/make-server-691c6bba/teams/:teamId", async (c) => {
  try {
    const teamId = c.req.param("teamId");
    const body = await c.req.json();
    const existingTeam = await kv.get(`team:${teamId}`);
    
    if (!existingTeam) {
      return c.json({ error: "Team not found" }, 404);
    }

    const updatedTeam = {
      ...existingTeam,
      name: body.name !== undefined ? body.name : existingTeam.name,
      vertical: body.vertical !== undefined ? body.vertical : existingTeam.vertical,
      memberIds: body.memberIds !== undefined ? body.memberIds : (existingTeam.memberIds || []),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`team:${teamId}`, updatedTeam);
    return c.json({ team: updatedTeam });
  } catch (error) {
    console.log("Error updating team:", error);
    return c.json({ error: "Failed to update team" }, 500);
  }
});

// Delete team
app.delete("/make-server-691c6bba/teams/:teamId", async (c) => {
  try {
    const teamId = c.req.param("teamId");
    const existingTeam = await kv.get(`team:${teamId}`);
    
    if (!existingTeam) {
      return c.json({ error: "Team not found" }, 404);
    }

    await kv.del(`team:${teamId}`);
    return c.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.log("Error deleting team:", error);
    return c.json({ error: "Failed to delete team" }, 500);
  }
});

// Create subteam within a team
app.post("/make-server-691c6bba/teams/:teamId/subteams", async (c) => {
  try {
    const teamId = c.req.param("teamId");
    const body = await c.req.json();
    const existingTeam = await kv.get(`team:${teamId}`);
    
    if (!existingTeam) {
      return c.json({ error: "Team not found" }, 404);
    }

    const subteamId = crypto.randomUUID();
    const newSubteam = {
      id: subteamId,
      name: body.name,
      memberIds: body.memberIds || []
    };

    const updatedTeam = {
      ...existingTeam,
      subteams: [...existingTeam.subteams, newSubteam],
      updatedAt: new Date().toISOString()
    };

    await kv.set(`team:${teamId}`, updatedTeam);
    return c.json({ team: updatedTeam }, 201);
  } catch (error) {
    console.log("Error creating subteam:", error);
    return c.json({ error: "Failed to create subteam" }, 500);
  }
});

// Update subteam
app.patch("/make-server-691c6bba/teams/:teamId/subteams/:subteamId", async (c) => {
  try {
    const teamId = c.req.param("teamId");
    const subteamId = c.req.param("subteamId");
    const body = await c.req.json();
    const existingTeam = await kv.get(`team:${teamId}`);
    
    if (!existingTeam) {
      return c.json({ error: "Team not found" }, 404);
    }

    const subteamIndex = existingTeam.subteams.findIndex(st => st.id === subteamId);
    if (subteamIndex === -1) {
      return c.json({ error: "Subteam not found" }, 404);
    }

    const updatedSubteams = [...existingTeam.subteams];
    updatedSubteams[subteamIndex] = {
      ...updatedSubteams[subteamIndex],
      name: body.name !== undefined ? body.name : updatedSubteams[subteamIndex].name,
      memberIds: body.memberIds !== undefined ? body.memberIds : updatedSubteams[subteamIndex].memberIds
    };

    const updatedTeam = {
      ...existingTeam,
      subteams: updatedSubteams,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`team:${teamId}`, updatedTeam);
    return c.json({ team: updatedTeam });
  } catch (error) {
    console.log("Error updating subteam:", error);
    return c.json({ error: "Failed to update subteam" }, 500);
  }
});

// Delete subteam
app.delete("/make-server-691c6bba/teams/:teamId/subteams/:subteamId", async (c) => {
  try {
    const teamId = c.req.param("teamId");
    const subteamId = c.req.param("subteamId");
    const existingTeam = await kv.get(`team:${teamId}`);
    
    if (!existingTeam) {
      return c.json({ error: "Team not found" }, 404);
    }

    const updatedSubteams = existingTeam.subteams.filter(st => st.id !== subteamId);

    const updatedTeam = {
      ...existingTeam,
      subteams: updatedSubteams,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`team:${teamId}`, updatedTeam);
    return c.json({ team: updatedTeam });
  } catch (error) {
    console.log("Error deleting subteam:", error);
    return c.json({ error: "Failed to delete subteam" }, 500);
  }
});

// ========== Generic KV Store Routes ==========

// Get value from KV store by key
app.get("/make-server-691c6bba/kv/:key", async (c) => {
  try {
    const key = c.req.param("key");
    console.log("Getting KV value for key:", key);
    
    const value = await kv.get(key);
    
    if (!value) {
      console.log("No value found for key:", key);
      return c.json(null);
    }
    
    // Try to parse as JSON if it's a string
    let parsedValue = value;
    if (typeof value === 'string') {
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        // If parsing fails, return as is
        parsedValue = value;
      }
    }
    
    console.log("Successfully retrieved KV value for key:", key);
    return c.json(parsedValue);
  } catch (error) {
    console.log("Error getting KV value:", error);
    return c.json({ error: "Failed to get value" }, 500);
  }
});

// Set value in KV store
app.post("/make-server-691c6bba/kv/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const body = await c.req.json();
    
    console.log("Setting KV value for key:", key);
    
    // Store as JSON string
    const valueToStore = JSON.stringify(body);
    await kv.set(key, valueToStore);
    
    console.log("Successfully stored KV value for key:", key);
    return c.json({ success: true, message: "Value stored successfully" });
  } catch (error) {
    console.log("Error setting KV value:", error);
    return c.json({ error: "Failed to set value" }, 500);
  }
});

// Delete value from KV store
app.delete("/make-server-691c6bba/kv/:key", async (c) => {
  try {
    const key = c.req.param("key");
    console.log("Deleting KV value for key:", key);
    
    await kv.del(key);
    
    console.log("Successfully deleted KV value for key:", key);
    return c.json({ success: true, message: "Value deleted successfully" });
  } catch (error) {
    console.log("Error deleting KV value:", error);
    return c.json({ error: "Failed to delete value" }, 500);
  }
});

// ========== System Settings Routes (Admin Only) ==========

// Get system setting by key
app.get("/make-server-691c6bba/settings/:key", async (c) => {
  try {
    const settingKey = c.req.param("key");
    const dbKey = `system:${settingKey}`;
    
    console.log(`[Settings] GET ${dbKey}`);
    
    const value = await kv.get(dbKey);
    
    if (!value) {
      console.log(`[Settings] No value found for ${dbKey}`);
      return c.json({ value: null });
    }
    
    // Parse JSON if it's a string
    let parsedValue = value;
    if (typeof value === 'string') {
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        parsedValue = value;
      }
    }
    
    console.log(`[Settings] Retrieved ${dbKey}:`, parsedValue);
    return c.json({ value: parsedValue });
  } catch (error) {
    console.error("[Settings] Error getting setting:", error);
    return c.json({ error: "Failed to get setting" }, 500);
  }
});

// Set system setting (no auth check - handled by frontend)
app.post("/make-server-691c6bba/settings/:key", async (c) => {
  try {
    const settingKey = c.req.param("key");
    const body = await c.req.json();
    const dbKey = `system:${settingKey}`;
    
    console.log(`[Settings] POST ${dbKey}:`, body.value);
    
    // Store the value as JSON string
    await kv.set(dbKey, JSON.stringify(body.value));
    
    console.log(`[Settings] Saved ${dbKey} successfully`);
    return c.json({ success: true, message: "Setting saved successfully" });
  } catch (error) {
    console.error("[Settings] Error saving setting:", error);
    return c.json({ error: "Failed to save setting" }, 500);
  }
});

// ========== Authentication Routes ==========

// Sign up new user
app.post("/make-server-691c6bba/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;
    
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }
    
    // Create Supabase client with service role key for admin operations
    const { createClient } = await import("jsr:@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    // Create user with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || '' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });
    
    if (error) {
      console.log("Error creating user:", error);
      return c.json({ error: error.message || "Failed to create user" }, 400);
    }
    
    console.log("User created successfully:", email);
    return c.json({ user: data.user }, 201);
  } catch (error) {
    console.log("Error in signup:", error);
    return c.json({ error: "Failed to sign up user" }, 500);
  }
});

// ========== Google Drive Assets Management ==========

// Initialize gdrive_previews bucket on startup
const initializeGDriveBucket = async () => {
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'gdrive_previews');
    
    if (!bucketExists) {
      await supabase.storage.createBucket('gdrive_previews', {
        public: false, // Private bucket, will use signed URLs
        fileSizeLimit: 5242880, // 5MB limit
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      console.log('Created gdrive_previews bucket');
    }
  } catch (error) {
    console.error('Failed to initialize gdrive_previews bucket:', error);
  }
};

// Initialize bucket
initializeGDriveBucket();

// Upload preview image for Google Drive asset
app.post("/make-server-691c6bba/gdrive/upload-preview", async (c) => {
  try {
    console.log('[Server] 📤 POST /gdrive/upload-preview - Starting upload...');
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const assetId = formData.get('assetId') as string;

    console.log('[Server] Received form data:', {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      projectId,
      assetId
    });

    if (!file || !projectId || !assetId) {
      console.error('[Server] ❌ Missing required fields');
      return c.json({ error: 'Missing required fields: file, projectId, assetId' }, 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('[Server] ❌ Invalid file type:', file.type);
      return c.json({ error: 'File must be an image' }, 400);
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.error('[Server] ❌ File too large:', file.size);
      return c.json({ error: 'File size must be less than 5MB' }, 400);
    }

    // Create file path: projectId/assetId-timestamp.ext
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${projectId}/${assetId}-${Date.now()}.${fileExt}`;
    console.log('[Server] Generated file path:', fileName);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log('[Server] File converted to Uint8Array, size:', uint8Array.length);

    // Upload to Supabase Storage
    console.log('[Server] Uploading to Supabase Storage bucket: gdrive_previews');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('gdrive_previews')
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('[Server] ❌ Upload error:', uploadError);
      return c.json({ error: `Failed to upload file: ${uploadError.message}` }, 500);
    }

    console.log('[Server] ✅ File uploaded successfully:', uploadData);

    // Create signed URL (valid for 1 year)
    console.log('[Server] Creating signed URL...');
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('gdrive_previews')
      .createSignedUrl(fileName, 31536000); // 1 year in seconds

    if (signedUrlError) {
      console.error('[Server] ❌ Signed URL error:', signedUrlError);
      return c.json({ error: 'Failed to create signed URL' }, 500);
    }

    console.log('[Server] ✅ Signed URL created successfully');

    const response = {
      success: true,
      signedUrl: signedUrlData.signedUrl,
      path: fileName
    };
    
    console.log('[Server] 📤 Sending response:', response);
    return c.json(response);

  } catch (error) {
    console.error('[Server] ❌ Error uploading preview:', error);
    return c.json({ error: 'Failed to upload preview image' }, 500);
  }
});

// Delete preview image for Google Drive asset
app.post("/make-server-691c6bba/gdrive/delete-preview", async (c) => {
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { previewUrl } = await c.req.json();

    if (!previewUrl) {
      return c.json({ error: 'Missing required field: previewUrl' }, 400);
    }

    // Extract file path from signed URL
    // Signed URLs look like: https://{project}.supabase.co/storage/v1/object/sign/gdrive_previews/{path}?token=...
    let filePath: string;
    try {
      const url = new URL(previewUrl);
      const pathMatch = url.pathname.match(/\/object\/sign\/gdrive_previews\/(.+)/);
      if (!pathMatch) {
        return c.json({ error: 'Invalid preview URL format' }, 400);
      }
      filePath = pathMatch[1];
    } catch (error) {
      console.error('Error parsing URL:', error);
      return c.json({ error: 'Invalid preview URL' }, 400);
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('gdrive_previews')
      .remove([filePath]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return c.json({ error: `Failed to delete file: ${deleteError.message}` }, 500);
    }

    return c.json({
      success: true,
      message: 'Preview image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting preview:', error);
    return c.json({ error: 'Failed to delete preview image' }, 500);
  }
});

// Delete folder and all its descendants from Google Drive assets
app.post("/make-server-691c6bba/gdrive/delete-folder", async (c) => {
  try {
    console.log('[Server] 🗑️ POST /gdrive/delete-folder - Starting delete...');
    
    const { projectId, folderId } = await c.req.json();
    
    if (!projectId || !folderId) {
      return c.json({ error: 'Missing required fields: projectId, folderId' }, 400);
    }
    
    console.log('[Server] Delete folder request:', { projectId, folderId });
    
    // Get project from KV store
    const project = await kv.get(`project:${projectId}`);
    if (!project) {
      console.error('[Server] Project not found:', projectId);
      return c.json({ error: 'Project not found' }, 404);
    }
    
    const gdriveAssets = project.gdrive_assets || [];
    console.log('[Server] Current gdrive_assets count:', gdriveAssets.length);
    
    // Find all descendants recursively
    const getAllDescendants = (parentId: string, assets: any[]): any[] => {
      const children = assets.filter((a: any) => a.parent_id === parentId);
      let descendants = [...children];
      for (const child of children) {
        descendants = [...descendants, ...getAllDescendants(child.id, assets)];
      }
      return descendants;
    };
    
    const descendants = getAllDescendants(folderId, gdriveAssets);
    const idsToRemove = new Set([folderId, ...descendants.map(d => d.id)]);
    
    console.log('[Server] Deleting folder and descendants:', {
      folderId,
      descendantsCount: descendants.length,
      totalToDelete: idsToRemove.size
    });
    
    // Filter out the folder and all its descendants
    const updatedAssets = gdriveAssets.filter((asset: any) => !idsToRemove.has(asset.id));
    
    // Update project in KV store
    const updatedProject = {
      ...project,
      gdrive_assets: updatedAssets,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`project:${projectId}`, updatedProject);
    
    console.log('[Server] ✅ Folder deleted successfully. New count:', updatedAssets.length);
    
    return c.json({
      success: true,
      deletedCount: idsToRemove.size,
      message: `Deleted folder and ${descendants.length} descendant(s)`
    });
    
  } catch (error) {
    console.error('[Server] ❌ Error deleting folder:', error);
    return c.json({ error: 'Failed to delete folder' }, 500);
  }
});

// ============================================================================
// ADMIN PROFILE ENDPOINTS
// ============================================================================

// Get admin profile (current user or default admin for public view)
app.get("/make-server-691c6bba/admin-profile", async (c) => {
  try {
    // Get user from Authorization header
    const authHeader = c.req.header('Authorization');
    let userEmail: string | null = null;
    let isPublicView = false;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      // Try to get user from token
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (user?.email) {
          // Authenticated user - return their profile
          userEmail = user.email;
        } else {
          // Token is invalid or is publicAnonKey - treat as public view
          console.log('[admin-profile] No user from token, treating as public view');
          isPublicView = true;
        }
      } catch (authError) {
        // Auth error - likely publicAnonKey or invalid token, treat as public view
        console.log('[admin-profile] Auth error, treating as public view:', authError);
        isPublicView = true;
      }
    } else {
      // No auth header - public view
      isPublicView = true;
    }

    // For public view, always return the admin profile (ryan.setiawan@tiket.com)
    // For authenticated users, return their profile
    const emailToFetch = isPublicView ? 'ryan.setiawan@tiket.com' : userEmail;
    
    if (!emailToFetch) {
      return c.json({ profile: null });
    }

    // Load profile from database using email as key
    const profileKey = `admin_profile:${emailToFetch}`;
    const profileData = await kv.get(profileKey);
    
    if (profileData) {
      return c.json({ profile: JSON.parse(profileData) });
    }

    // Return null if no profile exists
    return c.json({ profile: null });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Update admin profile
app.put("/make-server-691c6bba/admin-profile", async (c) => {
  try {
    // Get user from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get updates from request body
    const body = await c.req.json();
    const { updates } = body;

    if (!updates || typeof updates !== 'object') {
      return c.json({ error: 'Invalid updates' }, 400);
    }

    // Load existing profile
    const profileKey = `admin_profile:${user.email}`;
    const existingData = await kv.get(profileKey);
    const existingProfile = existingData ? JSON.parse(existingData) : {};

    // Merge with updates
    const updatedProfile = {
      ...existingProfile,
      ...updates,
      email: user.email, // Always preserve email
      updated_at: new Date().toISOString(),
    };

    // If this is first save, add created_at
    if (!existingProfile.created_at) {
      updatedProfile.created_at = new Date().toISOString();
    }

    // Save to database
    await kv.set(profileKey, JSON.stringify(updatedProfile));

    return c.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Upload admin profile photo
app.post("/make-server-691c6bba/admin-profile/upload-photo", async (c) => {
  try {
    // Get user from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get('photo');

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'File must be an image' }, 400);
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File size must be less than 5MB' }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `admin-profile/${user.email.replace('@', '_at_')}/${timestamp}_${safeName}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('admin_photos')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      // Create bucket if it doesn't exist
      if (uploadError.message.includes('Bucket not found')) {
        console.log('Creating admin_photos bucket...');
        const { error: bucketError } = await supabase.storage.createBucket('admin_photos', {
          public: false,
          fileSizeLimit: 5242880 // 5MB
        });

        if (bucketError) {
          console.error('Failed to create bucket:', bucketError);
          return c.json({ error: 'Failed to create storage bucket' }, 500);
        }

        // Retry upload
        const { data: retryData, error: retryError } = await supabase.storage
          .from('admin_photos')
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false
          });

        if (retryError) {
          console.error('Upload error after creating bucket:', retryError);
          return c.json({ error: `Failed to upload file: ${retryError.message}` }, 500);
        }
      } else {
        console.error('Upload error:', uploadError);
        return c.json({ error: `Failed to upload file: ${uploadError.message}` }, 500);
      }
    }

    // Create signed URL (valid for 10 years for profile photos)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('admin_photos')
      .createSignedUrl(fileName, 315360000); // 10 years in seconds

    if (signedError) {
      console.error('Error creating signed URL:', signedError);
      return c.json({ error: 'Failed to create signed URL' }, 500);
    }

    return c.json({
      url: signedData.signedUrl,
      path: fileName
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return c.json({ error: 'Failed to upload photo' }, 500);
  }
});

// System settings endpoints (for useSystemSettings hook)
app.get("/make-server-691c6bba/settings/:key", async (c) => {
  try {
    const key = c.req.param('key');
    const dbKey = `system:${key}`;
    
    const value = await kv.get(dbKey);
    
    return c.json({ 
      value: value ? JSON.parse(value) : null 
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    return c.json({ error: 'Failed to fetch setting' }, 500);
  }
});

app.post("/make-server-691c6bba/settings/:key", async (c) => {
  try {
    const key = c.req.param('key');
    const body = await c.req.json();
    const { value } = body;
    
    const dbKey = `system:${key}`;
    await kv.set(dbKey, JSON.stringify(value));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving setting:', error);
    return c.json({ error: 'Failed to save setting' }, 500);
  }
});

// ==================== SNACKBAR / ANNOUNCEMENT BANNER ENDPOINTS ====================

// Get snackbar settings (public - all users can read)
app.get("/make-server-691c6bba/announcement", async (c) => {
  try {
    const snackbarData = await kv.get('system_snackbar');
    
    return c.json({ 
      snackbar: snackbarData ? JSON.parse(snackbarData) : null 
    });
  } catch (error) {
    console.error('Error fetching snackbar:', error);
    return c.json({ error: 'Failed to fetch snackbar' }, 500);
  }
});

// Update snackbar settings (admin only - whitelist check)
app.post("/make-server-691c6bba/announcement", async (c) => {
  try {
    console.log('[Snackbar] POST /announcement - Updating snackbar settings');
    
    // Get user from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      console.log('[Snackbar] No Authorization header');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user?.email) {
      console.log('[Snackbar] Auth error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[Snackbar] User authenticated:', user.email);

    // Check if user is admin (whitelist)
    const adminWhitelist = ['ryan.setiawan@tiket.com'];
    if (!adminWhitelist.includes(user.email)) {
      console.log('[Snackbar] User not in admin whitelist:', user.email);
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const body = await c.req.json();
    console.log('[Snackbar] Request body received:', Object.keys(body));
    
    // Validate snackbar data structure
    const snackbarData = {
      enabled: body.enabled ?? false,
      text: body.text || '',
      backgroundColor: body.backgroundColor || '#3b82f6',
      textColor: body.textColor || '#ffffff',
      useAutoContrast: body.useAutoContrast ?? true,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      dismissable: body.dismissable ?? true,
      autoHide: body.autoHide ?? false,
      autoHideDuration: body.autoHideDuration || 10,
      icon: body.icon || { type: 'none', value: '' },
      updatedBy: user.email,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set('system_snackbar', JSON.stringify(snackbarData));
    
    console.log('[Snackbar] Successfully updated by', user.email);
    console.log('[Snackbar] Saved data:', {
      enabled: snackbarData.enabled,
      text: snackbarData.text?.substring(0, 50) + '...',
      useAutoContrast: snackbarData.useAutoContrast,
      dismissable: snackbarData.dismissable,
      autoHide: snackbarData.autoHide
    });
    
    return c.json({ 
      success: true,
      snackbar: snackbarData 
    });
  } catch (error) {
    console.error('[Snackbar] Error updating snackbar:', error);
    return c.json({ error: `Failed to update snackbar: ${error.message || error}` }, 500);
  }
});

// ========== Table Column Order Management (v2.4.0) ==========

// Get user's custom column order
app.get("/make-server-691c6bba/table-column-order", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.log('Error getting user for column order:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const key = `table_column_order:${user.id}`;
    const result = await kv.get(key);
    
    return c.json({
      success: true,
      columnOrder: result?.columnOrder || null,
      columnVisibility: result?.columnVisibility || null,
    });
  } catch (error) {
    console.error('Error loading column order:', error);
    return c.json({ error: 'Failed to load column order' }, 500);
  }
});

// Save user's custom column order and visibility
app.put("/make-server-691c6bba/table-column-order", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.log('Error getting user for column order save:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { columnOrder, columnVisibility } = await c.req.json();
    
    if (!Array.isArray(columnOrder)) {
      return c.json({ error: 'Invalid column order format' }, 400);
    }
    
    const key = `table_column_order:${user.id}`;
    
    // Get existing data to preserve other fields
    const existing = await kv.get(key);
    
    await kv.set(key, {
      columnOrder,
      columnVisibility: columnVisibility || existing?.columnVisibility || null,
      lastUpdated: new Date().toISOString(),
    });
    
    console.log(`Column order saved for user ${user.id}:`, columnOrder);
    if (columnVisibility) {
      console.log(`Column visibility saved for user ${user.id}:`, columnVisibility);
    }
    
    return c.json({
      success: true,
      columnOrder,
      columnVisibility: columnVisibility || existing?.columnVisibility || null,
    });
  } catch (error) {
    console.error('Error saving column order:', error);
    return c.json({ error: 'Failed to save column order' }, 500);
  }
});

// Reset user's column order to default
app.delete("/make-server-691c6bba/table-column-order", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.log('Error getting user for column order reset:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const key = `table_column_order:${user.id}`;
    await kv.del(key);
    
    console.log(`Column order reset to default for user ${user.id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting column order:', error);
    return c.json({ error: 'Failed to reset column order' }, 500);
  }
});

Deno.serve(app.fetch);