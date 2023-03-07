const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDbAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// API 1
// returns a list of all states in the state table

app.get("/states/", async (request, response) => {
  const getStatesListQuery = `
        SELECT * FROM state
    `;
  const getStatesQueryResponse = await db.all(getStatesListQuery);
  response.send(
    getStatesQueryResponse.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

// API 2
// returns a state based on stateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateListById = `
        SELECT * FROM state
        WHERE state_id = ${stateId}
    `;
  const getStateListByIdResponse = await db.get(getStateListById);
  response.send(convertStateDbObjectToResponseObject(getStateListByIdResponse));
});

// API 3
// create a district in district table

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `
        INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
        VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths})
    `;
  const createDistrictQueryResponse = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

// API 4
// returns a district based on districtId

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
        SELECT * FROM district
        WHERE district_id = ${districtId}
    `;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  response.send(
    convertDistrictDbObjectToResponseObject(getDistrictIdQueryResponse)
  );
});

// API 5
// delete a district from district table

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM district
        WHERE district_id = ${districtId}
    `;
  const deleteDistrictQueryResponse = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// API 6
// update the details of specific district based on district id

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateQuery = `
        UPDATE district 
        SET district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
    `;
  const updateQueryResponse = await db.run(updateQuery);
  response.send("District Details Updated");
});

// API 7
// returns the statistics

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
        SELECT SUM(cases) AS totalCases, SUM(cured) AS totalCured,
          SUM(active) AS totalActive, SUM(deaths) AS totalDeaths
        FROM district 
        WHERE state_id = ${stateId}
    `;
  const getStatesStatsQueryResponse = await db.get(getStateStatsQuery);
  response.send(getStatesStatsQueryResponse);
});

// API 8
// returns a object containing state name of district based on disrict id

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
        SELECT state_id FROM district
        WHERE district_id = ${districtId}
    `;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
        SELECT state_name AS stateName FROM state
        WHERE state_id = ${getDistrictIdQueryResponse.state_id}
    `;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
