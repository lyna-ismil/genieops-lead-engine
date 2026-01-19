import { Project } from "../types";

const STORAGE_KEY = 'genieops_projects';

export const getProjects = (): Project[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveProject = (project: Project): void => {
  const projects = getProjects();
  const existingIndex = projects.findIndex(p => p.id === project.id);
  
  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

export const getProjectById = (id: string): Project | undefined => {
  const projects = getProjects();
  return projects.find(p => p.id === id);
};

export const deleteProject = (id: string): void => {
    const projects = getProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}