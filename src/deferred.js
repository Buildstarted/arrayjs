(function() {
	function HashSet(list, comparer) {
		if (typeof(list) === "function") {
			this._comparer = list;
			this._list = [];
		} else {
			this._comparer = comparer;
			this._list = list ? list : [];
		}
	}
	
	HashSet.prototype.add = function(item) {
		if (this._comparer) {
			var found = false;
			for(var index = 0; index < this._list.length; index++) {
				if (this._comparer(this._list[index], item)) {
					found = true;
					break;
				}
			}
			
			if (!found) {
				this._list.push(item);
				return true;
			}
		} else {
			var i = this._list.indexOf(item);
			if (i == -1) {
				this._list.push(item);
				return true;
			}
		}
		return false;
	};
	
	HashSet.prototype.get = function(i) {
		return this._list[i];
	};
	
	HashSet.prototype.length = function() {
		return this._list.length;
	};
	
	HashSet.prototype.remove = function(item) {
		if (this._comparer) {
			for(var index = 0; index < this._list.length; index++) {
				if (this._comparer(this._list[index], item)) {
					this._list.splice(index, 1);
					return true;
				}
			}
		} else {
			var i = this._list.indexOf(item);
			if (i != -1) {
				this._list.splice(i, 1);
				return true;
			}
		}
		return false;
	};
	
	HashSet.prototype.toString = function() {
		return this._list.join(",");
	};

	var ArrayJs = window.ArrayJs = function(arr) {
		return new ArrayJs.fn.init(arr);
	};

	ArrayJs.fn = ArrayJs.prototype = {
		init: function(arr) {
			if (typeof(arr) === "function") {
				this.__iterator__ = arr;
			} else {
				var source = arr;
				this.__iterator__ = function() {
					for(var i = 0; i < source.length; i++) {
						yield source[i];
					}
				}
			}
			
			return this;
		},
		
		deferred: function() {
			return this.__iterator__();
		},
					
		//zip
		zip: function(second, resultSelector) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				try {
					var i1 = null;
					var i2 = null;
					var deferred = baseDelegate();
					second = second.constructor === (new ArrayJs).constructor 
								? second.deferred() 
								: new ArrayJs(second).deferred();
					
					while((i1 = deferred.next()) && (i2 = second.next())) {
						//console.log(i1, i2);
						yield resultSelector(i1, i2);
					}
				} catch (err if err instanceof StopIteration) {
					//no more
				}
			});
		},
		
		//toLookup
		toLookup: function(keySelector, elementSelector, comparer) {
			var baseDelegate = this.__iterator__;

			//if there's no keySelector then kill it
			if (!elementSelector) { elementSelector = function(e) { return e; } }

			var lookup = {
				map: [],
				keys: [],
				add: function(key, element) {
					if (lookup.keys.indexOf(key) === -1) {
						lookup.keys.push(key);
						lookup.map[key] = [];
						lookup.map[key].push(element);
					} else {
						if (lookup.map[key].indexOf(element) !== -1) {
							throw "Argument exception - adding duplicate element";
						} else {
							lookup.map[key].push(element);
						}
					}
				}
			};
			
			for(var i in baseDelegate()) {
				var key = keySelector(i);
				var element = elementSelector(i);
				lookup.add(key, element);
			}
			return lookup.map;
		},
		
		//toDictionary
//		toDictionary: function(predicate, defaultValue) {
//			var baseDelegate = this.__iterator__;
//			return new ArrayJs.fn.init(function() {
//				
//				var lookup = this.toLookup(keySelector, elementSelector, comparer);
//			
//				for(var i in baseDelegate()) {
//					yield { key: i, value: lookup[i]
//				}
//			});
//		},
		
		//orderByDescending
		orderByDescending: function(keySelector, comparer) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				
			
				//i really don't like this
				var values = []; 
				for(var i in baseDelegate()) {
					values.push(i);
				}
				
				var sortedKeys = [];

				if (comparer) {
					sortedKeys = values.select(keySelector).distinct().toArray().sort(comparer).reverse();
				} else {
					sortedKeys = values.select(keySelector).distinct().toArray().sort().reverse();
				}
				
				for(var i in sortedKeys) {
					for(var c in values.where(function(s) { return keySelector(s) === sortedKeys[i]; })) {
						yield c;
					}
				}
			});
		},
		
		//orderBy
		orderBy: function(keySelector, comparer) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {

				//i really don't like this
				var values = []; 
				for(var i in baseDelegate()) {
					values.push(i);
				}
				
				var sortedKeys = [];

				if (comparer) {
					sortedKeys = values.select(keySelector).distinct().toArray().sort(comparer);
				} else {
					sortedKeys = values.select(keySelector).distinct().toArray().sort();
				}
				
				for(var i in sortedKeys) {
					for(var c in values.where(function(s) { return keySelector(s) === sortedKeys[i]; })) {
						yield c;
					}
				}
			});
		},
		
		//intersect
		intersect: function(list, comparer) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!comparer) { comparer = function(a,b) { return a === b; }}
				//var potentialElements = this.distinct(list).toArray();
				var potentialElements = new HashSet(list);
				for(var i in baseDelegate()) {
					if (potentialElements.remove(i)) {
						yield i;
					}
				}
			});
		},
		
		//except
		except: function(second, comparer) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!comparer) { comparer = function(a, b) { return a === b; }}
				
				var banned = new HashSet(second);
				
				for(var i in baseDelegate()) {
					if (banned.add(i)) {
						yield i;
					}
				}
			});
		},
		
		//groupJoin
		groupJoin: function(predicate, defaultValue) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
			});
		},
		
		//join
		join: function(predicate, defaultValue) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
			});
		},
		
		//groupBy
		groupBy: function(predicate, defaultValue) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
			});
		},
		
		//skipWhile
		skipWhile: function(count, predicate) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!predicate) { predicate = function(i, x) { return x < count; }}
				var index = 0;
				for(var i in baseDelegate()) {
					if (!predicate(i, index)) {
						yield i;
					}
					
					index ++;
				}
			});
		},
		
		//skip
		skip: function(count) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				var index = 0;
				for(var i in baseDelegate()) {
					if (index < count) {
						yield i;
					}
					
					index ++;
				}
			});
		},
		
		//takeWhile
		takeWhile: function(count, predicate) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				var index = 0;
				if (!predicate) { predicate = function(i, x) { return x < count; }}
				for(var i in baseDelegate()) {
					if (index < count) {
						yield i;
					} else {
						break;
					}
					index ++;
				}
			});
		},
		
		//take
		take: function(count) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				var index = 0;
				for(var i in baseDelegate()) {
					if (index < count) {
						yield i;
					} else {
						break;
					}
					index ++;
				}
			});
		},
		
		//contains
		contains: function(value, comparer) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!comparer) { comparer = function(a, b) { return a === b; } }
				for(var i in baseDelegate()) {
					if (comparer(value, i)) { 
						return true;
					}
				}
				
				return false;
			});
		},
		
		//average
		average: function(selector) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!selector) { selector = function(s) { return s; }}
				var count = 0;
				var total = 0;
				for(var i in baseDelegate()) {
					var result = selector(i);
					total += result;
					count ++;
				}
				
				if (count === 0) {
					throw "Invalid operation - sequence was empty";
				}
				
				return total / count;
			});
		},
		
		//max
		max: function(selector, comparer) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!selector) { selector = function(s) { return s; }}
				if (!comparer) { comparer = function(a, b) { return a > b; }}
		
				var max = -9007199254740992;
				for(var i in baseDelegate()) {
					var result = selector(i);
					if (comparer(result, max)) {
						max = result;
					}
				}
				
				return max;
			});
		},
		
		//min
		min: function(selector, comparer) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!selector) { selector = function(s) { return s; }}
				if (!comparer) { comparer = function(a, b) { return a < b; }}
		
				var min = 9007199254740992;
				for(var i in baseDelegate()) {
					var result = selector(i);
					if (comparer(result, min)) {
						min = result;
					}
				}
				
				return min;
			});
		},
		
		//sum
		sum: function(selector) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!selector) { selector = function(s) { return s; }}
				
				var sum = 0;
				for(var i in baseDelegate()) {
					sum += selector(i);
				}
				
				return sum;
			});
		},
		
		//distinct
		distinct: function(comparer) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!comparer) { comparer = function(a, b) { return a === b; }}

				var seen = new HashSet(comparer);
				for(var item in baseDelegate()) {
					if (seen.add(item)) {
						yield item;
					}
				}
			});
		},
		
		//aggregate
		aggregate: function(seed, func, selector) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				var current = seed;
				for(var i in baseDelegate()) {
					current = func(current, i);
				}
				
				return selector(current);
			});
		},
		
		//lastOrDefault
		lastOrDefault: function(predicate, defaultValue) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!predicate) { predicate = function(s) { return true; }; }
				var foundAny = false;
				var result = null;
				for(var i in baseDelegate()) {
					if (predicate(i)) {
						foundAny = true;
						result = i;
					}
				}
				
				if (!foundAny) {
					return defaultValue;
				}
				
				return result;
			});
		},
		
		//last
		last: function(predicate, defaultValue) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!predicate) { predicate = function(s) { return true; }; }
				var foundAny = false;
				var result = null;
				for(var i in baseDelegate()) {
					if (predicate(i)) {
						foundAny = true;
						result = i;
					}
				}
				
				if (!foundAny) {
					throw "Invalid operation - no items matched the predicate";
				}
				
				return result;
			});
		},
		
		//singleOrDefault
		singleOrDefault: function(predicate, defaultValue) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				var foundAny = false;
				var result = null;
				if (!predicate) { predicate = function(s) { return true; }; }
				
				for(var i in baseDelegate()) {
					if (predicate(i)) {
						if (foundAny) {
							throw "Invalid operation - sequence contained multiple matching elements";
						}
				
						foundAny = true;
						result = i;
					}
				}
				
				if (!foundAny) {
					return defaultValue;
				}
				
				return result;
			});
		},
		
		//single
		single: function(predicate) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				var foundAny = false;
				var result = null;
				if (!predicate) { predicate = function(s) { return true; }; }
				
				for(var i in baseDelegate()) {
					if (predicate(i)) {
						if (foundAny) {
							throw "Invalid operation - sequence contained multiple matching elements";
						}
				
						foundAny = true;
						result = i;
					}
				}
				
				if (!foundAny) {
					throw "Invalid operation - no items matched the predicate";
				}
				
				return result;
			});
		},
		
		//firstOrDefault
		firstOrDefault: function(predicate, defaultValue) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!predicate) { predicate = function(s) { return true; }; }
				
				//figure out how to do an empty sequence
				for(var i in baseDelegate()) {
					if (predicate(i)) {
						return i;
					}
				}
				
				return defaultValue;
			});
		},
		
		//first
		first: function(predicate) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!predicate) { predicate = function(s) { return true; }; }
				
				//figure out how to do an empty sequence
				for(var i in baseDelegate()) {
					if (predicate(i)) {
						return i;
					}
				}
				
				throw "Invalid operation - no items matched the predicate";
			});
		},
		
		//all
		all: function(predicate) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!predicate) { predicate = function(s) { return true; }; }
				for(var i in baseDelegate()) {
					if (!predicate(this[i])) {
						return false;
					}
				}
			
				return true;
			});
		},
		
		//selectMany
		selectMany: function(selector) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!selector) { throw "Argument null 'selector'"; }
				for(var i in baseDelegate()) {
					var select = selector(i);
					for(var r in select) {
						yield selector(select[r]);
					}
				}
			});
		},
		
		//repeat
		repeat: function(item, count) {
			if (count < 0) {
				throw "Argument out of range 'count'";
			}

			for(var i = 0; i < count; i++) {
				yield i;
			}
		},
		
		//empty
		empty: function() {
			return [];
		},
		
		//range
		range: function(start, count) {
			if (count < 0) {
				throw "Argument out of range 'count'";
			}
						
			if (start + count - 1 > 9007199254740992) {
				throw "Argument out of range 'count'";
			}
			
			var result = [];
			for(var i = 0; i < count; i++) {
				yield i;
			}
		},
		
		//select
		select: function(selector) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!selector) { selector = function(i) { return i; }; }
				for(var i in baseDelegate()) {
					yield selector(i);
				}
			});
		},
		
		//any
		any: function(predicate) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!predicate) { predicate = function(i) { return true; }; }
				for(var i in baseDelegate()) {
					if (predicate(this[i])) {
						return true;
					}
				}
			
				return false;
			});
		},
		
		//count
		count: function(predicate) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				if (!predicate) { predicate = function(i) { return true; };	}
				var count = 0;
				for(var i in baseDelegate()) {
					if (predicate(i)) {
						count ++;
					}
				}
				
				return count;
			});
		},
		
		//where
		where: function(predicate) {
			var baseDelegate = this.__iterator__;
			return new ArrayJs.fn.init(function() {
				for(var i in baseDelegate()) {
					if (predicate(i)) {
						yield i;
					}
				}
			});
		},
		
		//toArray
		toArray: function(source) {
			var result = [];
			//use iterator
			for(var i in this.__iterator__()) {
				result.push(i);
			}
			
			return result;
		}
	};

	ArrayJs.fn.init.prototype = ArrayJs.fn;
})();
