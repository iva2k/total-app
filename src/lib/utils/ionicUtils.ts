export const loadIonicPWAElements = async (w: Window) => {
  const { defineCustomElements } = await import('@ionic/pwa-elements/loader');
  await defineCustomElements(w);
};
