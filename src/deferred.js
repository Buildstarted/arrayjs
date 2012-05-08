<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title></title>
    <link href="site.css" rel="stylesheet" type="text/css" />
	<script type="text/javascript;version=1.7" src="deferred.js"></script>
	<script type="text/javascript" src="array.js"></script>
	<script type="text/javascript">
	</script>
	<script type="text/javascript;version=1.7">
		
		var x = [
			{ name: "Ben", age: 31 },
			{ name: "Zoe", age: 0 },
			{ name: "Kim", age: 32 }
		];
		
		var y = [
			{ blah: 1 },
			{ blah: 2 },
			{ blah: 3 }
		];
		
		var a = new ArrayJs(y);
		console.log(a.constructor == (new ArrayJs).constructor);// == "ArrayJs");

		//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/length
		for(var result in x
				.where(function(x) x.age > -1)
				.distinct(function(a, b) a.age == b.age)
				.orderBy(function(a) a.name)) {
				
			console.log(result);
		}
		
	</script>
	
</head>
<body>

</body>
</html>
