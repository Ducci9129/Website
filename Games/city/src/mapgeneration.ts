/// <reference path="../data/cg.ts" />
/// <reference path="utility.ts" />
/// <reference path="cell.ts" />

module CityGame
{
  export module MapGeneration
  {

    var typeIndexes: any = {};
    function getIndexedType(typeName: string)
    {
      if (!typeIndexes[typeName])
      {
        typeIndexes[typeName] = findType(typeName);
      }

      return typeIndexes[typeName];
    }



    export function makeBlankCells(props:
    {
      width: number;
      height?: number;
    }): string[][]
    {
      props.height = props.height || props.width;

      var cells: string[][] = [];

      for (var i = 0; i < props.width; i++)
      {
        cells[i] = [];
        for (var j = 0; j < props.height; j++)
        {
          cells[i][j] = "grass";
        }
      }

      return cells;
    }

    export function convertCells(cellTypes: string[][], board: Board, autoInit: boolean): Cell[][]
    {
      var resultCells: Cell[][] = [];

      for (var i = 0; i < cellTypes.length; i++)
      {
        resultCells.push[i] = [];

        for (var j = 0; j < cellTypes[i].length; j++)
        {
          resultCells[i][j] = new Cell([i, j], getIndexedType(cellTypes[i][j]), board, autoInit);
        }
      }
      if (autoInit !== true)
      {
        for (var i = 0; i < resultCells.length; i++)
        {
          for (var j = 0; j < resultCells[i].length; j++)
          {
            resultCells[i][j].init();
          }
        }
      }

      return resultCells;
    }

    export function readSavedMap(props:
    {
      board: any
      savedCells: any;
    })
    {
      var cells = props.board.cells;

      for (var i = 0; i < props.board.width; i++)
      {
        for (var j = 0; j < props.board.height; j++)
        {
          var cell = cells[i][j];
          var savedCell = props.savedCells[i][j];



          cell.replace(getIndexedType(savedCell.type));

          if (savedCell.player)
          {
            savedCell.player.addCell(cell);
          }
          if (savedCell.content)
          {
            cell.changeContent(getIndexedType(savedCell.content.type), true,
              savedCell.content.player, false);
          }
          if (savedCell.undergroundContent)
          {
            cell.changeUndergroundContent( cg["content"]["tubes"]["tube_nesw"] );
          }
        }
      }
    }

    export interface ICardinalDirections
    {
      n: any;
      e: any;
      s: any;
      w: any;
    }

    export function generateCellNoise(props:
    {
      width: number;
      mapHeight?: number;

      coasts?: any;

      amount?: number;
      amountWeights?: number[];

      depth?: number;
      variation?: number;
      baseVariation?: number[];
      yFalloff?: number;
      yFalloffType?: number;
      xCutoff?: number;
      xFalloff?: number;
      xFalloffType?: number;
      xFalloffPerY?: number;
      landThreshhold?: number;
    })
    {

      props.mapHeight = props.mapHeight || props.width;


      var coasts = (function getcoastDirectionsFN(props)
        {
          if (props.coasts)
          {
            return props.coasts;
          }


          else
          {
            var amountOfCoasts: number = props.amount;
            var directionOfCoasts: ICardinalDirections =
            {
              n: {hasCoast: false},
              e: {hasCoast: false},
              s: {hasCoast: false},
              w: {hasCoast: false}
            }

            if (amountOfCoasts === undefined)
            {
              var amountOfCoasts = 0;
              var amountWeights = props.amountWeights ||
               [1, 0.5, 0.5, 0];

              for (var i = 0; i < amountWeights.length; i++)
              {
                if (1 - Math.random() < amountWeights[i])
                {
                  amountOfCoasts++;
                }
                else break;
              }
            }
            if (amountOfCoasts === 0)
            {
              for (var dir in directionOfCoasts)
              {
                directionOfCoasts[dir].hasCoast = false;
              }
            }
            else if (amountOfCoasts === 4)
            {
              for (var dir in directionOfCoasts)
              {
                directionOfCoasts[dir].hasCoast = true;
              }
            }
            else
            {
              var primaryCoast = getRandomKey(directionOfCoasts);
              directionOfCoasts[primaryCoast].hasCoast = true;

              var dirKeys = Object.keys(directionOfCoasts)

              var primaryIndex = dirKeys.indexOf(primaryCoast);

              var nextIndexOffset = Math.round(Math.random()) * 2 - 1; //-1 or 1

              for (var i = 1; i < amountOfCoasts; i++)
              {
                var nextIndex = (primaryIndex + nextIndexOffset) % dirKeys.length;
                if (nextIndex < 0) nextIndex += dirKeys.length;

                var nextKey = dirKeys[nextIndex];
                directionOfCoasts[nextKey].hasCoast = true;
                nextIndexOffset *= -1;
              }
            };

            return directionOfCoasts;
          }
        })(props);
      
      for (var _dir in coasts)
      {
        var dir = coasts[_dir];
        if (dir.hasCoast)
        {
          var isHorizontal = (_dir === "n" || _dir === "s");
          var x = props.width;
          var y = props.mapHeight;


          dir.depth          = dir.depth          || props.depth          ||
            Math.floor(y / 4);
          dir.variation      = dir.variation      || props.variation      ||
            0.05;
          dir.baseVariation  = dir.baseVariation  || props.baseVariation  ||
            [0, 1];
          dir.yFalloff       = dir.yFalloff       || props.yFalloff       ||
            dir.depth / 50;
          dir.yFalloffType   = dir.yFalloffType   || props.yFalloffType   ||
            "logarithmic";
          dir.xCutoff        = dir.xCutoff        || props.xCutoff        ||
            0.3;
          dir.xFalloff       = dir.xFalloff       || props.xFalloff       ||
            props.width / 150;
          dir.xFalloffType   = dir.xFalloffType   || props.xFalloffType   ||
            "logarithmic";
          dir.landThreshhold = dir.landThreshhold || props.landThreshhold ||
            0.20;
          dir.xFalloffPerY   = dir.xFalloffPerY   || props.xFalloffPerY   ||
            0;
        }
        var finalCoast: number[][] = dir.finalCoast = [];

        for (var i = 0; i < dir.depth; i++)
        {
          finalCoast[i] = [];

          var yFalloff: number;

          switch (dir.yFalloffType)
          {
            case "linear":
            {
              yFalloff = 1 - dir.yFalloff * i;
              break;
            }
            case "logarithmic":
            {
              //yFalloff = 1 - dir.yFalloff * Math.log(1.5*i);
              yFalloff = 1 - Math.log(1 + dir.yFalloff * i)

              if (yFalloff < 0) yFalloff = 0;
              break;
            }
          }
          var distanceOfCutoffStart = props.width / 2 - props.width / 2 * dir.xCutoff;
          for (var j = 0; j < x; j++)
          {
            var xFalloff: number = 1;
            var distanceFromCenter = Math.abs(props.width / 2 - (j+0.5));
            
            var relativeX = 1 - distanceFromCenter / (props.width / 2);

            if ( relativeX < dir.xCutoff )
            {
              var xDepth = (distanceFromCenter - distanceOfCutoffStart);
              switch (dir.xFalloffType)
              {
                case "linear":
                {
                  xFalloff = 1 - dir.xFalloff * xDepth;
                  break;
                }
                case "logarithmic":
                {
                  xFalloff = 1 - dir.xFalloff * Math.log(xDepth);
                  if (xFalloff < 0) xFalloff = 0;
                  break;
                }
              }
              xFalloff *= 1 - dir.xFalloffPerY * Math.log(i);
            }
            var n = (randRange(dir.baseVariation[0], dir.baseVariation[1]) +
              randRange(-dir.variation, dir.variation)) *
              yFalloff * xFalloff;
            n = n > dir.landThreshhold ? 1 : 0;
            finalCoast[i][j] = n;
          }
        };
      };
      return coasts;
    }

    export function applyCoastsToCells(props:
    {
      cells: string[][];
      primaryType: string;
      subType: string;

      coasts: any;
      offset?: number[];
    })
    {
      var coasts = props.coasts;

      for (var _dir in coasts)
      {
        var coast = coasts[_dir];
        var offset = coast.offset ?
          [Math.round(coast.offset[0]), Math.round(coast.offset[1])] :
          [0, 0];
        if (coast.hasCoast)
        {
          switch (_dir)
          {
            case "n":
            case "w":
            {
              coast.finalCoast = coast.finalCoast.reverse();
              break;
            }
          };

          switch (_dir)
          {
            case "e":
            case "w":
            {
              var rotated = [];
              for (var i = 0; i < coast.finalCoast.length; i++)
              {
                for (var j = 0; j < coast.finalCoast[i].length; j++)
                {
                  if (!rotated[j]) rotated[j] = [];
                  rotated[j][i] = coast.finalCoast[i][j];
                }
              }
              coast.finalCoast = rotated;
              break;
            }
          };
          switch (_dir)
          {
            case "w":
            {
              coast.startPoint = [offset[1], offset[0]];
              break;
            }
            case "n":
            {
              coast.startPoint = offset;
              break;
            }
            case "e":
            {
              coast.startPoint = [props.cells.length - coast.depth + offset[1], offset[0]];
              break;
            }
            case "s":
            {
              coast.startPoint = [offset[0], props.cells.length - coast.depth + offset[1]];
              break;
            }
          }


          for (var i = 0; i < coast.finalCoast.length; i++)
          {
            for (var j = 0; j < coast.finalCoast[i].length; j++)
            {
              var x = coast.startPoint[0] + j;
              var y = coast.startPoint[1] + i;

              var type = (coast.finalCoast[i][j] === 1) ?
                props.primaryType :
                props.subType;

              props.cells[x][y] = type;
            }
          }
        }
      }
    }
    export function makeRivers(coasts, genChance,
      riverProps, offset, maxCoastsToDrawRiver:number = 1)
    {
      var coastDirs = [];
      for (var dir in coasts)
      {
        if (coasts[dir].hasCoast)
        {
          coastDirs.push(dir);
        }
      }
      if (coastDirs.length < 1)
      {
        genChance += 0.2;
        riverProps.xFalloffPerY = 0;
        riverProps.yFalloff = 0.0000001;
        coastDirs.push(getRandomArrayItem(["n", "e", "s", "w"]));
      }

      if (coastDirs.length > maxCoastsToDrawRiver || Math.random() > genChance) return null;
      else
      {
        var randomDir = getRandomArrayItem(coastDirs);
        var directionToFlowFrom = getReverseDir(randomDir);

        riverProps.coasts =
        {
          n: {hasCoast: false},
          e: {hasCoast: false},
          s: {hasCoast: false},
          w: {hasCoast: false}
        }
        riverProps.coasts[directionToFlowFrom].hasCoast = true;
        riverProps.coasts[directionToFlowFrom].offset = offset;

        var river = generateCellNoise(riverProps);
        return river;
        //return generateCellNoise(riverProps);
      }
    }
    export function smoothCells(cells,
      minToChange: number = 0.4,
      radius: number = 1,
      times: number = 1)
    {
      var newCells = [];
      for (var i = 0; i < cells.length; i++)
      {
        newCells[i] = [];
        for (var j = 0; j < cells[i].length; j++)
        {
          var cell = cells[i][j];

          var neighbors = getArea(
          {
            targetArray: cells,
            start: [i, j],
            size: radius,
            excludeStart: false
          });
          var totalNeighborCount = 0;

          var neighborTypes: any = {};
          for (var k = 0; k < neighbors.length; k++)
          {
            var neigh = neighbors[k];

            if (neigh !== undefined)
            {
              if (!neighborTypes[neigh])
              {
                neighborTypes[neigh] = 0;
              }
              neighborTypes[neigh]++;
              totalNeighborCount++;
            }
          }

          var mostNeighborsType = undefined;
          var mostNeighborsCount = 0;
          for (var _type in neighborTypes)
          {
            if (neighborTypes[_type] > mostNeighborsCount)
            {
              mostNeighborsType = _type;
              mostNeighborsCount = neighborTypes[_type];
            }
          };
          if (mostNeighborsCount / totalNeighborCount >= minToChange)
          {
            newCells[i][j] = mostNeighborsType;
          }
          else
          {
            newCells[i][j] = cells[i][j];
          }
        }
      };

      times--;
      if (times > 0)
      {
        return smoothCells(newCells, minToChange, times);
      }
      else
      {
        return newCells;
      }
      
    }
  }

  function drawCoastInConsole(coast)
  {
    for (var i = 0; i < coast.finalCoast.length; i++)
    {
      var line = "" + i;
      var args = [""];
      for (var j = 0; j < coast.finalCoast[i].length; j++)
      {
        var c = (coast.finalCoast[i][j] === 1) ? "#0F0" : "#00F";
        line += "%c  ";
        args.push("background: " + c);
      }
      args[0] = line;
      console.log.apply(console, args);
    };
  }

  function drawNeighbors(neighs, center)
  {
    var dirs = [
      ["nw", "n", "ne"],
      ["w", "_c", "e"],
      ["sw", "s", "se"]
    ];

    neighs._c = center;

    for (var i = 0; i < dirs.length; i++)
    {
      var line = "" + i;
      var args = [""];
      for (var j = 0; j < dirs[i].length; j++)
      {
        var dir = dirs[i][j];

        if (!neighs[dir]) continue;

        var c = (neighs[dir] === "grass") ? "#0F0" : "#00F";
        line += "%c    ";
        args.push("background: " + c);
      }
    }
    args[0] = line;
    console.log.apply(console, args);
  }
}
