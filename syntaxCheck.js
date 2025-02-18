let test_string = "aaa: aaaaaaa:     aaaaaa";
let [comment, ...data] = test_string.split(":").map((s) => s.trim());
data = data.join(":").replace(/\s+/g, "_").toLowerCase();
console.log(data);