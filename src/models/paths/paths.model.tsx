/*
When thinking about roads, there are a number of things to think about.

Roads are made up of paths.

Paths
Paths are made of two things; nodes and segments. 
Each segment is made up of two nodes and a line between them. The line can be straight (“L x y”), or it could bend. Bends are made using bézier curves (“C x1 y1, x2 y2, x y” -OR- “S x2 y2, x y” -OR- “Q x1 y1, x y” -OR- “T x y”) or they could be arcs (“A rx ry x-axis-rotation large-arc-flag sweep-flag x y”). 
Each node is just a point on the map, but it can have one or more segments concerning to it. When a node has only one segment, it is an end node. When there are two segments, it is a connecting node, and when there are more than two segments, it is an intersection node.
Paths are often bundle together like you might find on a road. On a rode, you might have a sidewalk next to a bike lane, next to a turn only lane next to 2 lanes of AtoB traffic next to 3 lanes of BtoA traffic next to street parking next to another sidewalk. As the road bends and moves, these paths all need to bend with it. Some of these paths might merge or split. Some will have different usages. Some will be made of different materials. Some might have different speeds. Some paths are going to be wider than others.
Paths are often intended mainly for one use but could sometimes be used for mixed use. Paths for people to walk are walking paths. But if that path is next to a road, then it is a sidewalk. Roads are mostly used for cars, but if there is a crosswalk then people can walk on those parts of the road. Also, some roads are mixed use where people walk as needed and cars need to carefully drive as people walk around. Some walking paths share use with bike paths. Some roads have a dedicated bike lane while others share the road with bikes. Train rails are usually standalone paths just for trains, but some roads incorporate the rails into the road to allow trains and cars to travel on the same path.

usage:
-	forCars: boolean
-	forBusses: boolean
-	forTrucks: boolean
-	forPeople: boolean
-	forBikes: boolean
-	forTrains: boolean
-	forTrolies: boolean
-	…

Different materials affect both what the road looks like on the map (concrete can have a consistent color and may or may not have road markings while gravel and dirt are going to have different colors). It also determines how fast cars can move on them (different weather conditions would also affect them differently.) Also, Tains can only ever drive where there is rail. There should only be one material material per segment.
material: ‘concrete’ | ‘gravel’ | ‘dirt’ | ‘rail-on-concrete’ | ‘rail-on-stone’

Intersections need to be able to affect how traffic flows. Some intersections will have through traffic in one direction and stop signs on the smaller streets. Others might have a 4-way-stop and others might have a 4-way-light. 

The user should be able to go into build mode to add and modify roads as needed by moving nodes and curve anchor points. The user should be able to split a segment by adding a node in the middle. The user will need to be able to show how segments link to other segments when the lane splits or merges or when at an intersection. The user will also need to be able to control if an intersection is a stop/yield or a light.

I think the best way to handle nodes to to have one node the controls the road and a number of small nodes that control each path of the road. The main node will be used to move the road and the small nodes will be used to connect the paths from one road segment to another.

Each road segment can have its own properties and the paths can inherit properties from the segment, but individual paths can override those properties. For example, a road segment might have a speed limit of 30 mph, but a turn lane might have a speed limit of 10 mph. The road segment might be made of asphalt, but the sidewalk might be made of concrete. The road segment might be for cars, but the bike lane might be for bikes only.

There can also be settings for multiple segments that are bundled together. For example, a long road might be made up of multiple segments, but they might all have the same street name, speed limit, and material, ect. In this case, the user can set the properties for the entire road and then override them for individual segments as needed.

Also, not all paths need to be a road. A park might have walking and bike paths. A railway might have multiple sets of tracks. A parking lot might have multiple lanes for cars to drive through and stalls.

We also need to think about how to handle parking lots, parking garages, street parking, and other parking options. Parking lots need to also have handicap parking, electric vehicle charging stations, and other special parking options. Parking might need to be its own thing separate from roads, but it will need to interact with roads and paths.
*/

// --- Road/Path Model Types ---
