const getProjectRegionData = async () => {
  const [projectData, regionData] = await Promise.all([
    getProjectData(),
    getRegionData(),
  ]);
  return { projectData, regionData };
};

const getProjectData = async () => {
  try {
    const res = await fetch("/api/projects");
    return await res.json();
  } catch (err) {
    console.error("Error fetching project data:", err);
    return [];
  }
};

const getRegionData = async () => {
  try {
    const res = await fetch("/api/regions");
    return await res.json();
  } catch (err) {
    console.error("Error fetching region data:", err);
    return [];
  }
};

export default { getProjectRegionData, getProjectData, getRegionData };
