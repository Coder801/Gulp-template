// ===========
// Plagin Init
// ===========
var gulp = require('gulp');
var stylelintConfig = require('./stylelint.config.js');
var plugins = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'gulp.*', 'postcss-*', 'autoprefixer', 'css-mqpacker', 'lost', 'stylelint'],
	replaceString: /^(postcss|gulp|css)(-|\.)/,
	rename: {
		'gulp-if': 'gulpif'
	}
});

// ===========
// Varible
// ===========
var path = {
	dist: {
		html: 'dist/',
		css: 'dist/css/',
		js: 'dist/js/',
		fonts: 'dist/fonts/',
		img: 'dist/img/',
	},
	src: {
		data: './src/data/data.json',
		jade: 'src/jade/*.jade',
		css: 'src/css/style.css',
		js: ['src/js/vendor/*.js', 'src/js/*.js'],
		fonts: 'src/fonts/*',
		img: 'src/img/**/*.*',
	},
	watch: {
		html: 'src/jade/**/*.jade',
		css: 'src/css/**',
		js: 'src/js/**',
		fonts: 'src/fonts/*',
		img: 'src/img/**',
	},
	clean: 'dist/*',
	bower: 'libs/'
};

// ===========
// Tasks
// ===========
gulp.task('clean', function(cb) {
	return gulp.src(path.clean, {
			read: false
		})
		.pipe(plugins.ignore('sftp-config.json'))
		.pipe(plugins.rimraf());
});

gulp.task('html', function() {
	return gulp.src(path.src.jade)
		.pipe(plugins.watch(path.src.jade))
		.pipe(plugins.plumber())
		/*.pipe(plugins.data(function(file) {
			return require(path.src.data);
		}))*/
		.pipe(plugins.jade({
			pretty: true
		}))
		.pipe(plugins.prettify({
			indent_size: 4,
			max_preserve_newlines: 0,
			preserve_newlines: true
		}))
		.pipe(plugins.wiredep({
			directory: path.bower
		}))
		.pipe(plugins.inject(gulp.src(path.src.js[0], {
			read: false
		}), {
			relative: true
		}))
		.pipe(plugins.useref())
		/*.pipe(plugins.gulpif('*.js', plugins.jshint()))
		.pipe(plugins.gulpif('*.js', plugins.jshint.reporter('jshint-stylish')))*/
		.pipe(plugins.gulpif('*.js', plugins.uglify()))
		.pipe(plugins.gulpif('*.css', plugins.minifyCss()))
		.pipe(gulp.dest(path.dist.html))
		.pipe(plugins.connect.reload());
});

gulp.task('css', function() {
	var processors = [
		plugins.easyImport({
			partial: false,
			extensions: ['.css'],
			glob: true
		}), // Add file imports
		plugins.advancedVariables(), // Postcss varibles
		plugins.nested, // To unwrap nested rules like SASS
		plugins.lost, // Flexbox Grid
		plugins.mixins, // Add mixins (@define-mixin mixinName $param)
		plugins.atRulesVariables(), // Used in conjunction with the plugin postcss-each, postcss-conditionals, postcss-for and more at-rules plugins. ['for', 'if', 'else', 'each']
		plugins.customMedia(), // Custom Media Queries syntax to more compatible CSS. (@custom-media --small-viewport (max-width: 30em); @media (--small-viewport) {} => @media (max-width: 30em){})
		plugins.pxtorem({
			rootValue: 16,
			propWhiteList: ['font', 'font-size', 'line-height', 'letter-spacing'],
		}),
		plugins.calc(), // More pover calc()
		plugins.colorShort, // For hexadecimal, rgb and rgba (background: rgb(200); => background: rgb(200, 200, 200);)
		plugins.colorFunction, // Plugin to transform W3C CSS color function to more compatible CSS. 
		plugins.center, // Fast center align element ( * {top: center; left: center;})
		plugins.customSelectors, // Add array with selectors
		plugins.focusHover, // Add :focus selector to every :hover for keyboard accessibility (For hover only use *:only-hover)
		plugins.extend, // Add tries to minimize the number of repeat selectors and rules you write in CSS
		plugins.clearfix, // Adds fix and fix-legacy attributes to the clear property, for self-clearing of children
		plugins.autoprefixer({
			browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1', 'Safari 7']
		}),
		plugins.writeSvg, // Write SVGs directly in CSS.
		plugins.responsiveImages, // Add making responsive images. (image-size: responsive;)
		plugins.selectorMatches, // Plugin to transform :matches() W3C CSS pseudo class to more compatible CSS selectors
		plugins.selectorNot, // Add multiple css3 :not() selectors, like *:not(:first-child, .special)
		plugins.short, // Use advanced shorthand properties in CSS (Border, Color, Font-Size, Position, Size, Spacing, Text, Data, Font Weights)
		plugins.mqpacker, // Pack same CSS media query rules into one media query rule.
		plugins.stylelint(stylelintConfig),
		plugins.browserReporter({
			selector: 'body:before'
		})
	];
	return gulp.src(path.src.css)
		.pipe(plugins.plumber())
		.pipe(plugins.sourcemaps.init())
		.pipe(plugins.postcss(processors))
		.pipe(plugins.minifyCss())
		.pipe(plugins.sourcemaps.write('/sourcemap'))
		.pipe(gulp.dest(path.dist.css))
		.pipe(plugins.connect.reload());
});

gulp.task('js', function() {
	return gulp.src(path.src.js[1])
		.pipe(plugins.plumber({
			errorHandler: function(err) {
				console.log('Error');
			}
		}))
		.pipe(plugins.jshint())
		.pipe(plugins.jshint.reporter('jshint-stylish'))
		.pipe(plugins.babel({
			presets: ['es2015']
		}))
		.pipe(plugins.uglify())
		.pipe(gulp.dest(path.dist.js))
		.pipe(plugins.connect.reload());
});

gulp.task('modernizr', function() {
	return gulp.src(path.bower + 'modernizr/src/Modernizr.js')
		.pipe(plugins.modernizr({
			options: ["setClasses", "addTest", "html5printshiv", "testProp", "fnBind"],
			tests: ['flexbox', 'touchevents', 'mediaqueries']
		}))
		.pipe(plugins.uglify())
		.pipe(gulp.dest(path.dist.js));
});

gulp.task('img', function() {
	return gulp.src(path.src.img)
		.pipe(plugins.imagemin())
		.pipe(gulp.dest(path.dist.img))
		.pipe(plugins.connect.reload());
});

gulp.task('fonts', function() {
	return gulp.src(path.src.fonts)
		.pipe(gulp.dest(path.dist.fonts))
		.pipe(plugins.connect.reload());
});

gulp.task('bower', function() {
	return gulp.src(path.bower)
		.pipe(plugins.connect.reload());
});

gulp.task('build', ['html', 'js', 'css', 'img', 'bower', 'modernizr', 'fonts']);

gulp.task('connect', function() {
	plugins.connect.server({
		root: 'dist',
		livereload: true
	});
});

gulp.task('watch', function() {
	// gulp.watch(path.watch.html, ['html']);
	gulp.watch(path.watch.css, ['css']);
	gulp.watch(path.watch.js, ['js']);
	gulp.watch(path.watch.fonts, ['fonts']);
	gulp.watch(path.watch.img, ['img']);
	gulp.watch('bower.json', ['bower']);
});

gulp.task('default', ['build', 'connect', 'watch']);