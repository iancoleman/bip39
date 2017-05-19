jQuery(function($) {
	$('.virtual-keyboard').keyboard({

		autoAccept : true,
		
		accepted : function(event, keyboard, el) {
			$('.virtual-keyboard').trigger('input');
		},

		display: {
			'bksp'   : '\u2190',
		},

		layout: 'custom',

		customLayout: {

			'normal': [
				'` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
				'q w e r t y u i o p [ ] \\',
				'a s d f g h j k l ; \'',
				'{s} z x c v b n m , . / {s}',
				'{space}'
			],
			'shift': [
				'~ ! @ # $ % ^ & * ( ) _ + {bksp}',
				'Q W E R T Y U I O P { } |',
				'A S D F G H J K L : "',
				'{s} Z X C V B N M < > ? {s}',
				'{space}'
			]

		}

	});
});
