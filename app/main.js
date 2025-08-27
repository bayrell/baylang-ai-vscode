import { createApp, reactive } from "vue"
import Chat from "./Pages/Layout.vue";
import Layout from "./Pages/Layout.js";
import "./main.scss";
import 'highlight.js/styles/github.css';

/* Register layout */
const registerLayout = (layout) => {
	return {
		install: (app) => {
			app.config.globalProperties.layout = layout;
		},
	};
};

/* Start app */
window.startApp = (callback) => {
	
	/* Create layout */
	let layout = reactive(new Layout());
	window.app_layout = layout;

	/* Bind events */
	layout.bind();
	
	/* Create app */
	const app = createApp(Chat);
	app.use(registerLayout(layout));
	
	if (callback)
	{
		callback(app, layout);
	}
}