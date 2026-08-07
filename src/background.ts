import {
    fixSettingsOnUpdate,
    listenForMessages,
    monitorDownloads,
    monitorHotkey,
    monitorNotifications,
    reactToToolbarButton,
    registerContextMenu,
} from "./_background";
import { monitorStorage } from "./common";

monitorStorage();
fixSettingsOnUpdate();
monitorNotifications();
monitorDownloads();
monitorHotkey();
listenForMessages();
reactToToolbarButton();
registerContextMenu();
