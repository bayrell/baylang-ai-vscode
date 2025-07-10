import { createApp, reactive } from "vue"
import Chat from "./Components/Chat.vue";
import Layout from "./Model/Layout.js";

/* Create layout */
let layout = reactive(new Layout());

/* Register layout */
const registerLayout = (layout) => {
	return {
		install: (app) => {
			app.config.globalProperties.layout = layout;
		},
	};
};

/* Create app */
const app = createApp(Chat);
app.use(registerLayout(layout));

/* Mount app */
app.mount(".app");