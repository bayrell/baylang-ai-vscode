export default {
	spec_dir: "test",
	spec_files: [
		"**/*test.?(m)js"
	],
	env: {
		stopSpecOnExpectationFailure: false,
		random: true,
		forbidDuplicateNames: true
	}
}
