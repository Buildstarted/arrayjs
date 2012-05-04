Object.defineProperty(Array.prototype, "original", {
	value: (function() {
		function getOwnPropertyDescriptors(object) {
			var keys = Object.getOwnPropertyNames(object),
				returnObj = {};

			keys.forEach(getPropertyDescriptor);

			return returnObj;

			function getPropertyDescriptor(key) {
				var pd = Object.getOwnPropertyDescriptor(object, key);
				returnObj[key] = pd;
			}
		}
		
		function dup(o) {
			return Object.create(
				Object.getPrototypeOf(o),
				getOwnPropertyDescriptors(o)
			);
		}

		return dup(Array.prototype)
	})()
});

Object.defineProperty(Array.prototype, "zip", {
	value: function(second, resultSelector) {
		var result = [];
		var length = Math.min(this.length, second.length);
		for(var i = 0; i < length; i++) {
			result.push(resultSelector(this[i], second[i]));
		}
		
		return result;
	}
});

Object.defineProperty(Array.prototype, "toLookup", {
	value: function(keySelector, elementSelector, comparer) {
		if (!elementSelector) { elementSelector = function(e) { return e; } }

		var lookup = {
			map: [],
			keys: [],
			add: function(key, element) {
				if (!lookup.keys.contains(key)) {
					lookup.keys.push(key);
					lookup.map[key] = [];
					lookup.map[key].push(element);
				} else {
					if (lookup.map.contains(element)) {
						throw "Argument exception - adding duplicate element";
					} else {
						lookup.map[key].push(element);
					}
				}
			}
		};
		
		for(var i = 0; i < this.length; i++) {
			var key = keySelector(this[i]);
			var element = elementSelector(this[i]);
			lookup.add(key, element);
		}
					
		return lookup.map;
	}
});

Object.defineProperty(Array.prototype, "toDictionary", {
	value: function(keySelector, elementSelector, comparer) {
		var result = [];
		if (!elementSelector) { elementSelector = function(e) { return e; } }
					
		var lookup  = this.toLookup(keySelector, elementSelector, comparer);
		
		for(var i = 0; i < lookup.length; i++) {
			result.push({ key: i, value: lookup[i] });
		}
		
		return result;
	}
});

Object.defineProperty(Array.prototype, "orderByDescending", {
	value: function(keySelector, comparer) {
	
		var sortedKeys = [];
		if (comparer) {
			sortedKeys = this.select(keySelector).distinct().sort().reverse(comparer);
		} else {
			sortedKeys = this.select(keySelector).distinct().sort().reverse();
		}
		
		var result = [];
		for(var key = 0; key < sortedKeys.length; key++) {
			var selectedItems = this.where(function(s) keySelector(s) === sortedKeys[key]);
			for(var i = 0; i < selectedItems.length; i++) {
				result.push(selectedItems[i]);
			}
		}

		return result;
	}
});

Object.defineProperty(Array.prototype, "orderBy", {
	value: function(keySelector, comparer) {
	
		var sortedKeys = [];
		if (comparer) {
			sortedKeys = this.select(keySelector).distinct().sort(comparer);
		} else {
			sortedKeys = this.select(keySelector).distinct().sort();
		}
		
		var result = [];
		for(var key = 0; key < sortedKeys.length; key++) {
			var selectedItems = this.where(function(s) keySelector(s) === sortedKeys[key]);
			for(var i = 0; i < selectedItems.length; i++) {
				result.push(selectedItems[i]);
			}
		}

		return result;
	}
});

Object.defineProperty(Array.prototype, "intersect", {
	value: function(list, comparer) {
		var result = [];
		if (!comparer) { comparer = function(a, b) { return a === b; } }
		list = list.distinct();
		for(var i = 0; i < this.length; i++) {
			if (list.contains(this[i])) {
				result.push(this[i]);
			}
		}
		
		return result;
	}
});

Object.defineProperty(Array.prototype, "except", { 
	value: function(second, comparer) {
		if (!comparer) { comparer = function(a, b) { return a === b; } }
		
		var result = [];
		for(var i = 0; i < this.length; i++) {
			for(var r = 0; r < second.length; r++) {
				if (comparer(this[i], second[r])) {
					foundOne = true;
					break;
				}
			}
			if (!foundOne) {
				result.push(this[i]);
			}
		}
		
		return result;
	}
});

Object.defineProperty(Array.prototype, "groupJoin", { 
	value: function(inner, outerKeySelector, innerKeySelector, resultSelector, comparer) {
		var result = [];
	
		var lookup = inner.toLookup(innerKeySelector, null, comparer);
		for(var i = 0; i < this.length; i++) {
			var key = outerKeySelector(this[i]);
			result.push(resultSelector(this[i], lookup[key]));
		}
		
		return result;
	}
});

Object.defineProperty(Array.prototype, "join", { 
	value: function(inner, outerKeySelector, innerKeySelector, resultSelector, comparer) {
		if (!(inner instanceof Array) && !(outerKeySelector instanceof 'function') && !(innerKeySelector instanceof 'function')) {
			var args = Array.prototype.slice.call(arguments);
			return Array.prototype.original.join.apply(this, args);
		}

		if (!comparer) { comparer = function(a, b) { return a === b; }}
		if (!resultSelector) { resultSelector = function(a, b) { return a.toString() + "," + b.toString(); }}

		var lookup = inner.toLookup(innerKeySelector, null, comparer);
		return this.selectMany(function(o) lookup[outerKeySelector(o)], resultSelector);
	}
});

Object.defineProperty(Array.prototype, "groupBy", {
	value: function(keySelector, elementSelector, comparer) {
		if (!comparer) { comparer = function(a, b) { return a === b; } }
		return this.toLookup(keySelector, elementSelector, comparer);
	}
});

Object.defineProperty(Array.prototype, "skipWhile", { 
	value: function(count, predicate) {
		var index = 0;
		var i = 0;
		var result = [];
		for(i = 0; i < this.length; i++) {
			var item = this[i];
			if (!predicate(item, index)) {
				break;
			}
			index ++;
		}
		
		for(var current = i; current < this.length; current++) {
			result.push(this[current]);
		}

		return result;
	}
});

Object.defineProperty(Array.prototype, "skip", { 
	value: function(count) {
		return this.skipWhile(count, function(item, index) { return index < count; });
	}
});

Object.defineProperty(Array.prototype, "takeWhile", { 
	value: function(count, predicate) {
		var index = 0;
		var result = [];
		for(var i = 0; i < this.length; i++) {
			if (predicate(this[i], index)) {
				result.push(this[i]);
			} else {
				//no longer matches predicate
				break;
			}
			index ++;
		}
		
		return result;
	}
});
	
Object.defineProperty(Array.prototype, "take", { 
	value: function(count) {
		return this.takeWhile(count, function(item, index) { return index < count; });
	}
});

Object.defineProperty(Array.prototype, "contains", { 
	value: function(value, comparer) {
		if (!comparer) { comparer = function(a, b) { return a === b; } }
		for(var i = 0; i < this.length; i++) {
			if (comparer(value, this[i])) {
				return true;
			}
		}
		
		return false;
	}
});

Object.defineProperty(Array.prototype, "average", { 
	value: function(selector) {
		if (!selector) { selector = function(s) { return s; }}
		var count = 0;
		var total = 0;
		var filtered = this.select(selector);
		for(var i = 0; i < filtered.length; i++) {
			total += filtered[i];
			count ++;
		}
		
		if (count == 0) {
			throw "Invalid operation - sequence was empty";
		}
		
		return total / count;
	}
});

Object.defineProperty(Array.prototype, "max", { 
	value: function(selector, comparer) {
		if (!selector) { selector = function(s) { return s; }}
		if (!comparer) { comparer = function(a, b) { return a > b; }}
		
		var max = -9007199254740992;
		var filtered = this.select(selector);
		
		for(var i = 0; i < filtered.length; i++) {
			if (comparer(filtered[i], max)) {
				max = filtered[i];
			}
		}
		
		return max;
	}
});

Object.defineProperty(Array.prototype, "min", { 
	value: function(selector, comparer) {
		if (!selector) { selector = function(s) { return s; }}
		if (!comparer) { comparer = function(a, b) { return a < b; }}
		
		var min = 9007199254740992;
		var filtered = this.select(selector);
		for(var i = 0; i < filtered.length; i++) {
			if (comparer(filtered[i], min)) {
				min = filtered[i];
			}
		}
		
		return min;
	}
});

Object.defineProperty(Array.prototype, "sum", { 
	value: function(selector) {
		if (!selector) { selector = function(s) { return s; }}
	
		var sum = 0;
		for(var i = 0; i < this.length; i++) {
			sum += selector(this[i]);
		}
		
		return sum;
	}
});

Object.defineProperty(Array.prototype, "distinct", { 
	value: function(selector, comparer) {
		var result = [];
		
		if (!selector) { selector = function(s) { return s; }}
		if (!comparer) { comparer = function(a, b) { return a === b; }}
		
		var filtered = this.select(selector);
		
		for(var i = 0; i < filtered.length; i++) {
			//check seenElements for r
			var seenElement = false;
			for(var r = 0; r < result.length; r ++) {
				if (comparer(filtered[i], result[r])) {
					seenElement = true;
				}
			}
			
			if (!seenElement) {
				result.push(filtered[i]);
			}
		}
		
		return result;
	}
});

Object.defineProperty(Array.prototype, "aggregate", { 
	value: function(seed, func, selector) {
		var current = seed;
		for(var i = 0; i < this.length; i++) {
			current = func(current, this[i]);
		}
		
		return selector(current);
	}
});

Object.defineProperty(Array.prototype, "lastOrNull", { 
	value: function(predicate) {
		var foundAny = false;
		var result = null;
		for(var i = 0; i < this.length; i++) {
			if (predicate(this[i])) {
				foundAny = true;
				result = this[i];
			}
		}
		
		return result;
	}
});

Object.defineProperty(Array.prototype, "last", { 
	value: function(predicate) {
		if (!this.length) {
			throw "Invalid operation - sequence was empty";
		}
		
		if (!predicate) {
			return this[this.length-1];
		}
		
		var foundAny = false;
		var result = null;
		for(var i = 0; i < this.length; i++) {
			if (predicate(this[i])) {
				foundAny = true;
				result = this[i];
			}
		}
		
		if (!foundAny) {
			throw "Invalid operation - no items matched the predicate";
		}
		
		return result;
	}
});

Object.defineProperty(Array.prototype, "singleOrNull", { 
	value: function(predicate) {
		var foundAny = false;
		var result = null;
		for(var i = 0; i < this.length; i++) {
			if (predicate(this[i])) {
				if (foundAny) {
					throw "Invalid operation - sequence contained multiple matching elements";
				}
				
				foundAny = true;
				result = this[i];
			}
		}
		
		return result;
	}
});

Object.defineProperty(Array.prototype, "single", { 
	value: function(predicate) {
		var foundAny = false;
		var result = null;
		for(var i = 0; i < this.length; i++) {
			if (predicate(this[i])) {
				if (foundAny) {
					throw "Invalid operation - sequence contained multiple matching elements";
				}
				
				foundAny = true;
				result = this[i];
			}
		}
		
		if (!foundAny) {
			throw "Invalid operation - no items matched the predicate";
		}
		
		return result;
	}
});

Object.defineProperty(Array.prototype, "firstOrNull", { 
	value: function(predicate) {
		for(var i = 0; i < this.length; i++) {
			if (predicate(this[i])) {
				return this[i];
			}
		}
		
		return null;
	}
});

Object.defineProperty(Array.prototype, "first", { 
	value: function(predicate) {
		if (!predicate) {
			if (this.length) {
				return this[0];
			}
			
			throw "Invalid operation - sequence is empty";
		}
		for(var i = 0; i < this.length; i++) {
			if (predicate(this[i])) {
				return this[i];
			}
		}
		
		throw "Invalid operation - no items matched the predicate";
	}
});

Object.defineProperty(Array.prototype, "all", { 
	value: function(predicate) {
		for(var i = 0; i < this.length; i++) {
			if (!predicate(this[i])) {
				return false;
			}
		}
		
		return true;
	}
});

Object.defineProperty(Array.prototype, "any", { 
	value: function(predicate) {
		if (!predicate) {
			return this.length;
		}
		
		for(var i = 0; i < this.length; i++) {
			if (predicate(this[i])) {
				return true;
			}
		}
		
		return false;
	}
});

Object.defineProperty(Array.prototype, "selectMany", { 
	value: function(selector) {
		if (!selector) {
			throw "Argument null 'selector'";
		}
		
		var result = [];
		for(var i = 0; i < this.length; i++) {
			var select = selector(this[i]);
			for(var r in select) {
				result.push(select[r]);
			}
		}
		
		return result;
	}
});

Object.defineProperty(Array.prototype, "count", { 
	value: function(predicate) {
		if (!predicate) return this.length;
	
		var count = 0;
		for(var i = 0; i < this.length; i++) {
			if (predicate(this[i])) {
				count ++;
			}
		}
		
		return count;
	}
});

Object.defineProperty(Array.prototype, "repeat", { 
	value: function(item, count) {
		if (count < 0) {
			throw "Argument out of range 'count'";
		}
		
		var result = [];
		for(var i = 0; i < count; i++) {
			result.push(item);
		}
		
		return result;
	}
});

Object.defineProperty(Array.prototype, "empty", { 
	value: function() {
		return [];
	}
});

Object.defineProperty(Array.prototype, "range", { 
	value: function(start, count) {
		if (count < 0) {
			throw "Argument out of range 'count'";
		}
		
		if (start + count - 1 > 9007199254740992) {
			throw "Argument out of range 'count'";
		}
		
		var result = [];
		for(var i = 0; i < count; i++) {
			result.push(i);
		}
		
		return result;
	}
});

Object.defineProperty(Array.prototype, "where", { 
	value: function(predicate) {
		if (!this.length) return [];

		var result = [];
		for(var i = 0; i < this.length; i++) {
			if (predicate(this[i]) === true) {
				result.push(this[i]);
			}
		}

		return result;
	}
});

Object.defineProperty(Array.prototype, "select", { 
	value: function(predicate) {
		if (!this.length) return [];

		var result = [];
		for(var i = 0; i < this.length; i++) {
			result.push(predicate(this[i]));
		}

		return result;
	}
});