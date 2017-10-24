export const installApplication = application => ({ type: 'INSTALL_APPLICATION', application });
export const uninstallApplication = id => ({ type: 'UNINSTALL_APPLICATION', id });
export const updateApplication = application => ({ type: 'UPDATE_APPLICATION', application });
