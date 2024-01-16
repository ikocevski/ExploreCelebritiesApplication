package com.example;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.json.JSONObject;

public class WikidataServlet extends HttpServlet {
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {

        String celebrityName = request.getParameter("celebrityName");

        try {
            // Construct SPARQL query to retrieve image URLs
            String sparqlQuery = "PREFIX wd: <http://www.wikidata.org/entity/>\n" +
                    "PREFIX wdt: <http://www.wikidata.org/prop/direct/>\n" +
                    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                    "SELECT ?image WHERE {\n" +
                    "  ?item rdfs:label \"" + celebrityName + "\"@en ;\n" +
                    "        wdt:P18 ?image .\n" +
                    "}";

            System.out.println("Sparql Query:\n" + sparqlQuery);

            String imageUrl = queryWikidataSparqlEndpoint(sparqlQuery);
            System.out.println("imageUrl: " + imageUrl); // Log the imageUrl

            // Create a JSON response containing the image URL
            JSONObject jsonResponse = new JSONObject();
            if (imageUrl != null) {
                jsonResponse.put("image", imageUrl);
            }

            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(jsonResponse.toString());
        } catch (Exception e) {
            System.err.println("Error fetching data from WikiData: " + e.getMessage());
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error fetching data from WikiData.");
        }
    }

    private String queryWikidataSparqlEndpoint(String sparqlQuery) {
        try (QueryExecution queryExecution = QueryExecutionFactory.sparqlService("https://query.wikidata.org/sparql", sparqlQuery)) {
            ResultSet resultSet = queryExecution.execSelect();
            if (resultSet.hasNext()) {
                QuerySolution solution = resultSet.nextSolution();
                return solution.get("image").toString();
            }
        } catch (Exception e) {
            System.err.println("Exception while querying WikiData: " + e.getMessage());
        }
        return null;
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        doGet(request, response);
    }
}
