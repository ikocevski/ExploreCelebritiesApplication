package com.example;

import org.apache.jena.query.*;
import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class SparqlServlet extends HttpServlet {
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        String celebrityName = request.getParameter("celebrityName");

        String sparqlQuery = "PREFIX dbo: <http://dbpedia.org/ontology/> " +
                "PREFIX dbr: <http://dbpedia.org/resource/> " +
                "SELECT ?location ?birthDate ?birthName ?occupation ?spouse " +
                "WHERE { " +
                "  dbr:" + celebrityName + " dbo:birthPlace ?location . " +
                "  OPTIONAL { dbr:" + celebrityName + " dbo:birthDate ?birthDate . } " +
                "  OPTIONAL { dbr:" + celebrityName + " dbo:birthName ?birthName . } " +
                "  OPTIONAL { dbr:" + celebrityName + " dbo:occupation ?occupation . } " +
                "  OPTIONAL { dbr:" + celebrityName + " dbo:spouse ?spouse . } " +
                "}";

        try (QueryExecution queryExecution = QueryExecutionFactory.sparqlService("http://dbpedia.org/sparql", sparqlQuery)) {
            ResultSet resultSet = queryExecution.execSelect();
            JSONObject resultJSON = new JSONObject();
            JSONArray locationsArray = new JSONArray();

            while (resultSet.hasNext()) {
                QuerySolution solution = resultSet.nextSolution();
                String location = solution.get("location").toString();
                locationsArray.put(location);

                if (solution.contains("birthDate")) {
                    String birthDate = solution.get("birthDate").toString();
                    resultJSON.put("birthDate", birthDate);
                }

                if (solution.contains("birthName")) {
                    String birthName = solution.get("birthName").toString();
                    resultJSON.put("birthName", birthName);
                }

                if (solution.contains("occupation")) {
                    String occupation = solution.get("occupation").toString();
                    resultJSON.put("occupation", occupation);
                }

                if (solution.contains("spouse")) {
                    String spouse = solution.get("spouse").toString();
                    resultJSON.put("spouse", spouse);
                }
            }

            resultJSON.put("locations", locationsArray);

            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(resultJSON.toString());
        } catch (Exception e) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error fetching data from DBpedia.");
        }
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        doGet(request, response);
    }
}
