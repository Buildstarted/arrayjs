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

	var stopIteration;
	if (typeof StopIteration === 'undefined') {
		console.log("StopIteration undefined - creating");
		stopIteration = function() {
			throw "Stop Iteration";
		};
		StopIteration = stopIteration;
	} else {
		stopIteration = function() { throw "Stop Iteration"; };
	}

	var Yield = function(arr) {
		return new Yield.fn.init(arr);
	};
	
	Yield.fn = Yield.prototype = {
		createArrayYield: function(s) {
			return this.createYield(function(y) {
				for(var i = 0; i < s.length; i++) {
					y(s[i]);
				}
			});
		},
		createYield: function(f) {
			return function (y) {
				var stopped = false;
				var index = 0;

				try {
					f(function (val) {
						if (stopped) {
							stopIteration();
						}
						var send = y(val, index, stopIteration);
						index++;
						return send;
					});
				} catch (ex) {
					if (ex !== "Stop Iteration") {
						//only worry about StopIteration, 
						//anything else isn't us
						throw ex;
					}
				} finally {
					stopped = true;
				}
			};
		},
		init: function(source) {
			if (typeof(source) === "function") {
				this.deferred = this.createYield(source);
			} else if (source.constructor === [].constructor) {
				this.deferred = this.createArrayYield(source);
			}
			return this;
		},
		toLookup: function(keySelector, elementSelector, comparer) {
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
			
			this.deferred(function(val, index, stop) {
				var key = keySelector(val);
				var element = elementSelector(val);
				lookup.add(key, element);
			});
			
			return lookup.map;
		},
		orderByDescending: function(keySelector, comparer) {
			var source = this;
			return new Yield.fn.init(function(y) {
				var values = [];
				source.deferred(function(val, index, stop) {
					values.push(i);
				});
				
				var sortedKeys = [];

				if (comparer) {
					sortedKeys = values.select(keySelector).distinct().toArray().sort(comparer).reverse();
				} else {
					sortedKeys = values.select(keySelector).distinct().toArray().sort().reverse();
				}
		
				for(var i in sortedKeys) {
					for(var c in values.where(function(s) { return keySelector(s) === sortedKeys[i]; })) {
						y(c);
					}
				}
			});
		},
		orderBy: function(keySelector, comparer) {
			var source = this;
			return new Yield.fn.init(function(y) {
				var values = [];
				source.deferred(function(val, index, stop) {
					values.push(i);
				});
				
				var sortedKeys = [];

				if (comparer) {
					sortedKeys = values.select(keySelector).distinct().toArray().sort(comparer);
				} else {
					sortedKeys = values.select(keySelector).distinct().toArray().sort();
				}
		
				for(var i in sortedKeys) {
					for(var c in values.where(function(s) { return keySelector(s) === sortedKeys[i]; })) {
						y(c);
					}
				}
			});
		},
		intersect: function(list, comparer) {
			var source = this;
			return new Yield.fn.init(function(y) {
				var potentialElements = new HashSet(list);
				source.deferred(function(val, index, stop) {
					if (potentialElements.remove(val)) {
						y(val);
					}
				});
			});
		},
		except: function(second, comparer) {
			var source = this;
			return new Yield.fn.init(function(y) {
				var banned = new HashSet(second, comparer);
				source.deferred(function(val) {
					if (banned.add(val)) {
						y(val);
					}
				});
			});
		},
		groupJoin: function(inner, outerKeySelector, innerKeySelector, resultSelector, comparer) {
			var source = this;
			return new Yield.fn.init(function(y) {
				var lookup = inner.toLookup(innerKeySelector, null, comparer);
				source.deferred(function(val, index, stop) {
					var key = outerKeySelector(val);
					y(resultSelector(key, lookup[key]));
				});
			});
		},
		join: function(inner, outerKeySelector, innerKeySelector, resultSelector, comparer) {
			var source = this;
			return new Yield.fn.init(function(y) {
				if (!comparer) { comparer = function(a, b) { return a === b; }}
				if (!resultSelector) { resultSelector = function(a, b) { return a.toString() + "," + b.toString(); }}
				
				var lookup = inner.toLookup(innerKeySelector, null, comparer);
				return this.selectMany(function(o) {
					y(function(o) { return lookup[OuterKeySelector(o)]; })
				}, resultSelector);
			});
		},
		groupBy: function(keySelector, elementSelector, comparer) {
			return this.toLookup(keySelector, elementSelector, comparer);
		},
		skipWhile: function(count, predicate) {
			var source = this;
			return new Yield.fn.init(function(y) {
				var index = 0;
				source.deferred(function(val) {
					if (index >= count && (predicate ? predicate(val) : true)) {
						y(val);
					}
					index ++;
				});
			});
		},
		skip: function(count) {
			var source = this;
			return new Yield.fn.init(function(y) {
				var index = 0;
				source.deferred(function(val) {
					if (index >= count) {
						y(val);
					}
					index ++;
				});
			});
		},
		takeWhile: function(count, predicate) {
			var source = this;
			return new Yield.fn.init(function(y) {
				var index = 0;
				source.deferred(function(val) {
					if (index < count && (predicate ? predicate(val) : true)) {
						y(val);
						index ++;
					} else {
						stop();
					}
				});
			});
		},
		take: function(count) {
			var source = this;
			return new Yield.fn.init(function(y) {
				var index = 0;
				source.deferred(function(val) {
					if (index < count) {
						y(val);
					} else {
						stop();
					}
					index ++;
				});
			});
		},
		contains: function(value, comparer) {
			var result = false;
			this.deferred(function(val, index, stop) {
				if (comparer ? comparer(value, val) : value === val) {
					result = true;
					stop();
				}
			});
			
			return result;
		},
		average: function(selector) {
			var count = 0;
			var total = 0;
			this.deferred(function(val, index, stop) {
				var result = selector ? selector(val) : val;
				total += result;
				count ++;
			});
			
			if (count === 0) {
				throw "Invalid operation - sequence was empty";
			}
			
			return total / count;
		},
		max: function(selector, comparer) {
			if (!selector) { selector = function(s) { return s; }}
			if (!comparer) { comparer = function(a, b) { return a > b; }}
	
			var max = -9007199254740992;
			this.deferred(function(val, index, stop) {
				var result = selector(val);
				if (comparer(result, max)) {
					max = result;
				}
			});
			
			return max;
		},
		min: function(selector, comparer) {
			if (!selector) { selector = function(s) { return s; }}
			if (!comparer) { comparer = function(a, b) { return a < b; }}
	
			var min = 9007199254740992;
			this.deferred(function(val, index, stop) {
				var result = selector(val);
				if (comparer(result, min)) {
					min = result;
				}
			});
			
			return min;
		},
		sum: function(selector) {
			var sum = 0;
			this.deferred(function(val, index, stop) {
				sum += selector ? selector(val) : val;
			});
			
			return sum;
		},
		distinct: function(comparer) {
			var source = this;
			return new Yield.fn.init(function(y) {
				var seen = new HashSet(comparer);
				
				source.deferred(function(val) {
					if (seen.add(val)) {
						y(val);
					}
				});
			});
		},
		aggregate: function(seed, func, selector) {
			var current = seed;
			this.deferred(function(val, index, stop) {
				current = func(current, val);
			});
			
			return selector(current);
		},
		lastOrDefault: function(predicate, defaultValue) {
			var result = defaultValue ? defaultValue : null;
			this.deferred(function(val, index, stop) {
				if (predicate ? predicate(val) : true) {
					result = val;
				}
			});
			
			return result;
		},
		last: function(predicate) {
			var result = null;
			var foundAny = false;
			this.deferred(function(val, index, stop) {
				if (predicate ? predicate(val) : true) {
					foundAny = true;
					result = val;
				}
			});
			
			if (!foundAny) {
				throw "Invalid operation - no items matched the predicate";
			}
			
			return result;
		},
		singleOrDefault: function(predicate, defaultValue) {
			var foundAny = false;
			var result = defaultValue;
			
			this.deferred(function(val, index, stop) {
				if (predicate ? predicate(val) : true) {
					if (foundAny) {
						throw "Invalid operation - sequence contained multiple matching elements";
					}
					
					foundAny = true;
					result = val;
				}
			});
			
			return result;
		},
		single: function(predicate) {
			var foundAny = false;
			var result = null;
			
			this.deferred(function(val, index, stop) {
				if (predicate ? predicate(val) : true) {
					if (foundAny) {
						throw "Invalid operation - sequence contained multiple matching elements";
					}
					
					foundAny = true;
					result = val;
				}
			});
			
			if (!foundAny) {
				throw "Invalid operation - no items matched the predicate";
			}
			
			return result;
		},
		firstOrDefault: function(predicate, defaultValue) {
			var result = defaultValue;
			this.deferred(function(val, index, stop) {
				if (predicate ? predicate(val) : true) {
					result = val;
					stop();
				}
			});
			
			return result;
		},
		first: function(predicate) {
			var result = null;
			var foundAny = false;
			this.deferred(function(val, index, stop) {
				if ((predicate ? predicate(val) : true)) {
					result = val;
					foundAny = true;
					stop();
				}
			});
						
			if (!foundAny) {
				throw "Invalid operation - no items matched the predicate";
			}
						
			return result;
		},
		all: function(predicate) {
			var result = true;
			this.deferred(function(val, index, stop) {
				if (!(predicate ? predicate(val) : true)) {
					result = false;
					stop();
				}
			});
			
			return result;
		},
		selectMany: function(collectionSelector, resultSelector) {
			var source = this;
			return new Yield.fn.init(function(y) {
				var index = 0;
				source.deferred(function(val) {
					var select = collectionSelector(val, index++);
					for(var r in select) {
						y(val, select[r]);
					}
				});
			});
		},
		any: function(predicate) {
			var result = false;
			this.deferred(function(val, index, stop) {
				if (predicate ? predicate(val) : true) {
					result = true;
					//we found a match, stop processing
					stop();
				}
			});
			
			return result;
		},
		select: function(selector) {
			var source = this;
			return new Yield.fn.init(function(y) {
				source.deferred(function(val) {
					y(selector ? selector(val) : val);
				});
			});
		},
		count: function(predicate) {
			var source = this;
			var count = 0;
			if (!predicate) { predicate = function(i) { return true; }; }
			this.deferred(function(val, index, stop) {
				if (predicate ? predicate(val) : true) {
					count ++;
				}
			});
			
			return count;
		},
		where: function(predicate) {
			var source = this;
			return new Yield.fn.init(function(y) {
				source.deferred(function(val) {
					if (predicate(val)) {
						y(val);
					}
				});
			});
		},
		__iterator__: function() {
			var result = [];
			
			this.deferred(function(val) { 
				result.push(val); 
			});
			
			var index = 0;
			
			return {
				next: function() {
					if (index < result.length) {
						var value = result[index];
						index ++;
						return value;
					} else {
						throw StopIteration;
					}
				}
			};
		},
		toArray: function() {
			var result = [];
			
			this.deferred(function(val) { 
				result.push(val); 
			});
			
			return result;
		}
	};
	
	Yield.fn.init.prototype = Yield.fn;

	Object.defineProperty(Array, "yieldSupported", {
		value: (function() {
			try {
				//eval("function x() { yield 1; }");
				return true;
			} catch(e) {
				return false;
			}
		})()
	});

	Object.defineProperty(Array.prototype, "base", {
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
			if (Array.yieldSupported) { return new ArrayJs(this).zip(second, resultSelector); }
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
			return new Yield(this).toLookup(keySelector, elementSelector, comparer);
		}
	});

	Object.defineProperty(Array.prototype, "orderByDescending", {
		value: function(keySelector, comparer) {
			return new Yield(this).orderByDescending(keySelector, comparer);
		}
	});

	Object.defineProperty(Array.prototype, "orderBy", {
		value: function(keySelector, comparer) {
			return new Yield(this).orderBy(keySelector, comparer);
		}
	});

	Object.defineProperty(Array.prototype, "intersect", {
		value: function(list, comparer) {
			return new Yield(this).intersect(list, comparer);
		}
	});

	Object.defineProperty(Array.prototype, "except", { 
		value: function(second, comparer) {
			return new Yield(this).except(second, comparer);
		}
	});

	Object.defineProperty(Array.prototype, "groupJoin", { 
		value: function(inner, outerKeySelector, innerKeySelector, resultSelector, comparer) {
			return new Yield(this).groupJoin(inner, outerKeySelector, innerKeySelector, resultSelector, comparer);
		}
	});

	Object.defineProperty(Array.prototype, "join", { 
		value: function(inner, outerKeySelector, innerKeySelector, resultSelector, comparer) {
			return new Yield(this).join(inner, outerKeySelector, innerKeySelector, resultSelector, comparer);
		}
	});

	Object.defineProperty(Array.prototype, "groupBy", {
		value: function(keySelector, elementSelector, comparer) {
			return new Yield(this).groupBy(keySelector, elementSelector, comparer);
		}
	});

	Object.defineProperty(Array.prototype, "skipWhile", { 
		value: function(count, predicate) {
			return new Yield(this).skipWhile(count, predicate)
		}
	});

	Object.defineProperty(Array.prototype, "skip", { 
		value: function(count) {
			return new Yield(this).skip(count);
		}
	});

	Object.defineProperty(Array.prototype, "takeWhile", { 
		value: function(count, predicate) {
			return new Yield(this).takeWhile(count, predicate);
		}
	});
		
	Object.defineProperty(Array.prototype, "take", { 
		value: function(count) {
			return new Yield(this).take(count);
		}
	});

	Object.defineProperty(Array.prototype, "contains", { 
		value: function(value, comparer) {
			return new Yield(this).contains(value, comparer);
		}
	});

	Object.defineProperty(Array.prototype, "average", { 
		value: function(selector) {
			return new Yield(this).average(selector);
		}
	});

	Object.defineProperty(Array.prototype, "max", { 
		value: function(selector, comparer) {
			return new Yield(this).max(selector, comparer);
		}
	});

	Object.defineProperty(Array.prototype, "min", { 
		value: function(selector, comparer) {
			return new Yield(this).min(selector, comparer);
		}
	});

	Object.defineProperty(Array.prototype, "sum", { 
		value: function(selector) {
			return new Yield(this).sum(selector);
		}
	});

	Object.defineProperty(Array.prototype, "distinct", { 
		value: function(comparer) {
			return new Yield(this).distinct(comparer);
		}
	});

	Object.defineProperty(Array.prototype, "aggregate", { 
		value: function(seed, func, selector) {
			return new Yield(this).aggregate(seed, func, selector);
		}
	});

	Object.defineProperty(Array.prototype, "lastOrDefault", { 
		value: function(predicate, defaultValue) {
			return new Yield(this).lastOrDefault(predicate, defaultValue);
		}
	});

	Object.defineProperty(Array.prototype, "last", { 
		value: function(predicate) {
			return new Yield(this).last(predicate);
		}
	});

	Object.defineProperty(Array.prototype, "singleOrDefault", { 
		value: function(predicate, defaultValue) {
			return new Yield(this).singleOrDefault(predicate, defaultValue);
		}
	});

	Object.defineProperty(Array.prototype, "single", { 
		value: function(predicate) {
			return new Yield(this).single(predicate);
		}
	});

	Object.defineProperty(Array.prototype, "firstOrDefault", { 
		value: function(predicate, defaultValue) {
			return new Yield(this).firstOrDefault(predicate, defaultValue);
		}
	});

	Object.defineProperty(Array.prototype, "first", { 
		value: function(predicate) {
			return new Yield(this).first(predicate);
		}
	});

	Object.defineProperty(Array.prototype, "all", { 
		value: function(predicate) {
			return new Yield(this).all(predicate);
		}
	});

	Object.defineProperty(Array.prototype, "any", { 
		value: function(predicate) {
			return new Yield(this).any(predicate);
		}
	});

	Object.defineProperty(Array.prototype, "selectMany", { 
		value: function(collectionSelector, resultSelector) {
			return new Yield(this).selectMany(collectionSelector, resultSelector);
		}
	});

	Object.defineProperty(Array.prototype, "count", { 
		value: function(predicate) {
			return new Yield(this).count(predicate);
		}
	});

	Object.defineProperty(Array, "repeat", { 
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

	Object.defineProperty(Array, "empty", { 
		value: function() {
			return [];
		}
	});

	Object.defineProperty(Array, "range", { 
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
			return new Yield(this).where(predicate);
		}
	});

	Object.defineProperty(Array.prototype, "select", { 
		value: function(predicate) {
			return new Yield(this).select(predicate);
		}
	});
})();