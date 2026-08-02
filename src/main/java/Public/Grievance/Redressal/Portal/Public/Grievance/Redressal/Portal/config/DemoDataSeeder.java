package Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.config;

import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.entity.*;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.enums.*;
import Public.Grievance.Redressal.Portal.Public.Grievance.Redressal.Portal.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class DemoDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final ComplaintRepository complaintRepository;
    private final ComplaintUpdateRepository complaintUpdateRepository;
    private final ComplaintUpvoteRepository complaintUpvoteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("=========================================================");
        log.info("      STARTING DEMO DATA SEEDING (app.seed.enabled=true)  ");
        log.info("=========================================================");

        String defaultPassword = "password123";
        String encodedPassword = passwordEncoder.encode(defaultPassword);

        // 1. Fetch existing departments
        List<Department> departments = departmentRepository.findAll();
        if (departments.isEmpty()) {
            log.warn("No departments found in DB. Seeding core departments first.");
            departments = createCoreDepartments();
        }

        Map<Category, Department> categoryDeptMap = mapCategoriesToDepartments(departments);

        // 2. Seed Department Heads & Officers per department
        List<User> seededDeptHeads = new ArrayList<>();
        List<User> seededOfficers = new ArrayList<>();
        Map<Department, List<User>> deptOfficersMap = new HashMap<>();

        for (Department dept : departments) {
            // Check or create Dept Head
            String deptSlug = dept.getName().toLowerCase().replaceAll("\\s+", "");
            String headEmail = deptSlug + ".head@portal.gov";
            Optional<User> existingHeadOpt = userRepository.findByEmail(headEmail);
            User head;
            if (existingHeadOpt.isPresent()) {
                head = existingHeadOpt.get();
            } else {
                head = userRepository.save(User.builder()
                        .name(dept.getName() + " Department Head")
                        .email(headEmail)
                        .passwordHash(encodedPassword)
                        .role(Role.DEPT_HEAD)
                        .department(dept)
                        .build());
            }
            seededDeptHeads.add(head);

            if (dept.getDeptHead() == null) {
                dept.setDeptHead(head);
                departmentRepository.save(dept);
            }

            // Create 2 officers per department
            List<User> officers = new ArrayList<>();
            for (int i = 1; i <= 2; i++) {
                String officerEmail = deptSlug + ".officer" + i + "@portal.gov";
                Optional<User> existingOfficerOpt = userRepository.findByEmail(officerEmail);
                User officer;
                if (existingOfficerOpt.isPresent()) {
                    officer = existingOfficerOpt.get();
                } else {
                    officer = userRepository.save(User.builder()
                            .name(dept.getName() + " Officer " + i)
                            .email(officerEmail)
                            .passwordHash(encodedPassword)
                            .role(Role.OFFICER)
                            .department(dept)
                            .build());
                }
                officers.add(officer);
                seededOfficers.add(officer);
            }
            deptOfficersMap.put(dept, officers);
        }

        // 3. Seed 15 Citizens
        List<User> citizens = new ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            String citizenEmail = "citizen" + i + "@example.com";
            Optional<User> existingCitizenOpt = userRepository.findByEmail(citizenEmail);
            User citizen;
            if (existingCitizenOpt.isPresent()) {
                citizen = existingCitizenOpt.get();
            } else {
                citizen = userRepository.save(User.builder()
                        .name("Citizen " + i)
                        .email(citizenEmail)
                        .passwordHash(encodedPassword)
                        .role(Role.CITIZEN)
                        .build());
            }
            citizens.add(citizen);
        }

        // 4. Seed 45 Complaints with diverse categories, pincodes, statuses, priorities
        String[] pincodes = {"600001", "600028", "600096", "560001", "560034", "110001", "400001", "500001", "700001", "600040"};
        String[] areas = {"Anna Nagar", "T. Nagar", "Velachery", "Indiranagar", "Koramangala", "Connaught Place", "Andheri West", "Banjara Hills", "Park Street", "Mylapore"};

        List<ComplaintTemplate> templates = getComplaintTemplates();
        Random random = new Random(42); // fixed seed for reproducible realistic data

        List<Complaint> seededComplaints = new ArrayList<>();
        int complaintIndex = 0;

        for (ComplaintTemplate t : templates) {
            complaintIndex++;
            User citizen = citizens.get(random.nextInt(citizens.size()));
            Department dept = categoryDeptMap.get(t.category);
            if (dept == null) dept = departments.get(0);

            String pincode = t.pincode != null ? t.pincode : pincodes[random.nextInt(pincodes.length)];
            String area = areas[random.nextInt(areas.length)];

            Status status = t.status;
            User assignedOfficer = null;
            if (status != Status.FILED && deptOfficersMap.containsKey(dept)) {
                List<User> officers = deptOfficersMap.get(dept);
                assignedOfficer = officers.get(random.nextInt(officers.size()));
            }

            Complaint complaint = Complaint.builder()
                    .title(t.title)
                    .description(t.description)
                    .category(t.category)
                    .pincode(pincode)
                    .areaName(area)
                    .status(status)
                    .priority(t.priority)
                    .citizen(citizen)
                    .department(dept)
                    .assignedOfficer(assignedOfficer)
                    .upvoteCount(0)
                    .build();

            complaint = complaintRepository.save(complaint);

            // Seed updates timeline
            seedTimelineForComplaint(complaint, citizen, dept, assignedOfficer);

            // Upvotes
            int numUpvotes = random.nextInt(6);
            Set<UUID> upvotedCitizens = new HashSet<>();
            for (int u = 0; u < numUpvotes; u++) {
                User upvoter = citizens.get(random.nextInt(citizens.size()));
                if (upvotedCitizens.add(upvoter.getId())) {
                    complaintUpvoteRepository.save(ComplaintUpvote.builder()
                            .complaint(complaint)
                            .citizen(upvoter)
                            .build());
                }
            }
            complaint.setUpvoteCount(upvotedCitizens.size());
            complaintRepository.save(complaint);

            seededComplaints.add(complaint);
        }

        // 5. Backdate created_at timestamps across past 30 days to build realistic Volume Trend chart
        log.info("Backdating created_at timestamps across past 30 days for volume trend chart...");
        for (int i = 0; i < seededComplaints.size(); i++) {
            Complaint c = seededComplaints.get(i);
            int daysAgo = 30 - (i * 30 / seededComplaints.size()); // uniform spread over 30 days
            Instant backdated = Instant.now().minus(daysAgo, ChronoUnit.DAYS).minus(random.nextInt(12), ChronoUnit.HOURS);
            jdbcTemplate.update("UPDATE complaints SET created_at = ?, updated_at = ? WHERE id = CAST(? AS uuid)",
                    java.sql.Timestamp.from(backdated),
                    java.sql.Timestamp.from(backdated.plus(random.nextInt(48), ChronoUnit.HOURS)),
                    c.getId().toString());
        }

        log.info("=========================================================");
        log.info("         DEMO DATA SEEDING COMPLETE SUMMARY              ");
        log.info("=========================================================");
        log.info("Departments:        {}", departments.size());
        log.info("Department Heads:   {}", seededDeptHeads.size());
        log.info("Officers:           {}", seededOfficers.size());
        log.info("Citizens:           {}", citizens.size());
        log.info("Complaints:         {}", seededComplaints.size());
        log.info("---------------------------------------------------------");
        log.info("DEMO LOGIN CREDENTIALS (password: 'password123'):");
        log.info("Super Admin:        admin@portal.gov / Admin@123456");
        log.info("Water Dept Head:    water.head@portal.gov");
        log.info("Water Officer 1:    water.officer1@portal.gov");
        log.info("Roads Dept Head:    roads.head@portal.gov");
        log.info("Roads Officer 1:    roads.officer1@portal.gov");
        log.info("Citizen Account:    citizen1@example.com");
        log.info("=========================================================");
    }

    private Map<Category, Department> mapCategoriesToDepartments(List<Department> departments) {
        Map<Category, Department> map = new EnumMap<>(Category.class);
        for (Department dept : departments) {
            String nameUpper = dept.getName().toUpperCase().replaceAll("\\s+", "_");
            for (Category cat : Category.values()) {
                if (cat.name().equalsIgnoreCase(nameUpper) || dept.getName().equalsIgnoreCase(cat.name())) {
                    map.put(cat, dept);
                }
            }
        }
        // Fill defaults if any category was missing
        if (!departments.isEmpty()) {
            Department first = departments.get(0);
            for (Category cat : Category.values()) {
                map.putIfAbsent(cat, first);
            }
        }
        return map;
    }

    private List<Department> createCoreDepartments() {
        String[] names = {"Water", "Roads", "Electricity", "Sanitation", "Public Health", "Other"};
        List<Department> list = new ArrayList<>();
        for (String n : names) {
            list.add(departmentRepository.save(Department.builder()
                    .name(n)
                    .description(n + " department grievances redressal unit")
                    .build()));
        }
        return list;
    }

    private void seedTimelineForComplaint(Complaint c, User citizen, Department dept, User officer) {
        // FILED update
        complaintUpdateRepository.save(ComplaintUpdate.builder()
                .complaint(c)
                .actor(citizen)
                .oldStatus(null)
                .newStatus(Status.FILED)
                .remarks("Complaint registered by citizen.")
                .build());

        if (c.getStatus() == Status.FILED) return;

        // ASSIGNED update
        User deptHead = dept.getDeptHead();
        complaintUpdateRepository.save(ComplaintUpdate.builder()
                .complaint(c)
                .actor(deptHead != null ? deptHead : citizen)
                .oldStatus(Status.FILED)
                .newStatus(Status.ASSIGNED)
                .remarks("Complaint assigned to field officer " + (officer != null ? officer.getName() : "Officer"))
                .build());

        if (c.getStatus() == Status.ASSIGNED) return;

        // IN_PROGRESS update
        complaintUpdateRepository.save(ComplaintUpdate.builder()
                .complaint(c)
                .actor(officer != null ? officer : deptHead)
                .oldStatus(Status.ASSIGNED)
                .newStatus(Status.IN_PROGRESS)
                .remarks("Field inspection started. Equipment and crew deployed.")
                .build());

        if (c.getStatus() == Status.IN_PROGRESS) return;

        // RESOLVED update
        complaintUpdateRepository.save(ComplaintUpdate.builder()
                .complaint(c)
                .actor(officer != null ? officer : deptHead)
                .oldStatus(Status.IN_PROGRESS)
                .newStatus(Status.RESOLVED)
                .remarks("Issue successfully rectified. Photo evidence attached.")
                .build());

        if (c.getStatus() == Status.RESOLVED) return;

        // REOPENED update
        if (c.getStatus() == Status.REOPENED) {
            complaintUpdateRepository.save(ComplaintUpdate.builder()
                    .complaint(c)
                    .actor(citizen)
                    .oldStatus(Status.RESOLVED)
                    .newStatus(Status.REOPENED)
                    .remarks("Problem persisted after initial repair. Requesting re-inspection.")
                    .build());
        }
    }

    private record ComplaintTemplate(String title, String description, Category category, Priority priority, Status status, String pincode) {}

    private List<ComplaintTemplate> getComplaintTemplates() {
        return List.of(
                // Water Department (with duplicate cluster on 600001)
                new ComplaintTemplate("Broken Water Main Pipe leaking heavily", "Drinking water pipe burst near 4th main road entrance, thousands of liters wasting.", Category.WATER, Priority.HIGH, Status.IN_PROGRESS, "600001"),
                new ComplaintTemplate("Severe Water Leakage near 4th Main Road", "Water leaking on street, low pressure in nearby homes.", Category.WATER, Priority.HIGH, Status.FILED, "600001"),
                new ComplaintTemplate("No Water Supply for 3 Days in Zone 4", "Pipeline maintenance issues causing total water outage in Block B.", Category.WATER, Priority.HIGH, Status.RESOLVED, "600001"),
                new ComplaintTemplate("Contaminated Dirty Water from Taps", "Brownish sewage water mixing with tap supply in local residential complex.", Category.WATER, Priority.HIGH, Status.ASSIGNED, "600001"),
                new ComplaintTemplate("Low Water Pressure in Top Floors", "Apartment residents unable to pump water to overhead tanks.", Category.WATER, Priority.MEDIUM, Status.RESOLVED, "600028"),
                new ComplaintTemplate("Damaged Sewer-Water Line Junction", "Drainage overflow mixing near overhead public tank.", Category.WATER, Priority.HIGH, Status.IN_PROGRESS, "600096"),
                new ComplaintTemplate("Unregulated Sewage Leak into Lake", "Industrial discharge leaking near community park boundary line.", Category.WATER, Priority.HIGH, Status.REOPENED, "560001"),
                new ComplaintTemplate("Public Tap Valve Broken & Spilling", "Handpump and public tap valve snapped open near market.", Category.WATER, Priority.LOW, Status.RESOLVED, "560034"),

                // Roads Department (with duplicate cluster on 560001)
                new ComplaintTemplate("Massive Pothole near Metro Station Entrance", "Deep crater on main boulevard causing dangerous vehicle skids.", Category.ROADS, Priority.HIGH, Status.IN_PROGRESS, "560001"),
                new ComplaintTemplate("Dangerous Pothole on Metro Road", "Large pothole opened up after heavy rains.", Category.ROADS, Priority.HIGH, Status.FILED, "560001"),
                new ComplaintTemplate("Road Surface Erosion after Heavy Rain", "Asphalt washed away on 100ft road junction.", Category.ROADS, Priority.HIGH, Status.ASSIGNED, "560001"),
                new ComplaintTemplate("Unfinished Road Construction Left Open", "Trench left un-barricaded near school zone.", Category.ROADS, Priority.HIGH, Status.RESOLVED, "600001"),
                new ComplaintTemplate("Speed Breaker Unpainted & Missing Warning Sign", "Dangerous unmarked hump causing motorcycle accidents at night.", Category.ROADS, Priority.MEDIUM, Status.RESOLVED, "600028"),
                new ComplaintTemplate("Broken Footpath Tiles causing Pedestrian Trips", "Pavement damaged with missing concrete slabs.", Category.ROADS, Priority.LOW, Status.RESOLVED, "110001"),
                new ComplaintTemplate("Illegal Road Digging without Permit", "Cable operators cut across newly paved asphalt lane.", Category.ROADS, Priority.HIGH, Status.IN_PROGRESS, "400001"),
                new ComplaintTemplate("Traffic Light Pole Leaning Dangerously", "Heavy wind bent junction signal pole over pedestrian walk.", Category.ROADS, Priority.HIGH, Status.RESOLVED, "500001"),

                // Electricity Department
                new ComplaintTemplate("Transformer Sparking and Flashing Overhead", "High voltage transformer emitting loud buzzing sound and sparks near house.", Category.ELECTRICITY, Priority.HIGH, Status.IN_PROGRESS, "600028"),
                new ComplaintTemplate("Frequent Unannounced Power Cuts in Sector 3", "Power outages 4-5 times daily lasting over 2 hours each.", Category.ELECTRICITY, Priority.HIGH, Status.RESOLVED, "600028"),
                new ComplaintTemplate("Streetlight Flickering and Failing at Night", "Entire street illuminated poorly due to blown LED bulbs.", Category.ELECTRICITY, Priority.MEDIUM, Status.FILED, "600096"),
                new ComplaintTemplate("Hanging Live Cable touching Tree Branches", "Exposed power line dangling close to public walking path.", Category.ELECTRICITY, Priority.HIGH, Status.ASSIGNED, "560034"),
                new ComplaintTemplate("Electric Meter Box Open and Exposed to Rain", "Main distribution box door broken, open to monsoon rain.", Category.ELECTRICITY, Priority.HIGH, Status.RESOLVED, "110001"),
                new ComplaintTemplate("Low Voltage Damage to Household Appliances", "Voltage fluctuations dropping below 150V consistently.", Category.ELECTRICITY, Priority.HIGH, Status.REOPENED, "400001"),

                // Sanitation Department
                new ComplaintTemplate("Garbage Overflowing from Dumpster for 5 Days", "Commercial market waste piling up on main road creating foul smell.", Category.SANITATION, Priority.HIGH, Status.IN_PROGRESS, "600096"),
                new ComplaintTemplate("Garbage Not Collected in Street 4", "Door-to-door waste collection truck skipped area for a week.", Category.SANITATION, Priority.MEDIUM, Status.FILED, "600096"),
                new ComplaintTemplate("Clogged Stormwater Drain causing Street Flooding", "Plastic bags blocking drain inlet near bus stand.", Category.SANITATION, Priority.HIGH, Status.RESOLVED, "560034"),
                new ComplaintTemplate("Open Manhole Cover near Children Play Area", "Heavy iron drain lid missing, extreme hazard at night.", Category.SANITATION, Priority.HIGH, Status.ASSIGNED, "110001"),
                new ComplaintTemplate("Illegal Dumping of Construction Debris", "Tractor dumped concrete blocks on public playground sidewalk.", Category.SANITATION, Priority.HIGH, Status.RESOLVED, "400001"),
                new ComplaintTemplate("Public Toilet Facility Unclean and Locked", "Community restroom unusable due to lack of running water and cleaning.", Category.SANITATION, Priority.MEDIUM, Status.RESOLVED, "500001"),

                // Public Health Department
                new ComplaintTemplate("Stagnant Mosquito Breeding Water in Empty Plot", "Rainwater trapped in vacant land causing severe dengue outbreak risk.", Category.PUBLIC_HEALTH, Priority.HIGH, Status.IN_PROGRESS, "110001"),
                new ComplaintTemplate("Stray Dogs Aggressive near Primary School", "Pack of dogs chasing cyclists and children during morning hours.", Category.PUBLIC_HEALTH, Priority.HIGH, Status.ASSIGNED, "400001"),
                new ComplaintTemplate("Unsanitary Meat Shop Waste Disposed in Open", "Vendor throwing animal waste directly into open roadside gutter.", Category.PUBLIC_HEALTH, Priority.HIGH, Status.RESOLVED, "500001"),
                new ComplaintTemplate("Fumigation Spraying Request for Sector B", "High incidence of malaria cases reported in neighborhood.", Category.PUBLIC_HEALTH, Priority.MEDIUM, Status.FILED, "700001"),
                new ComplaintTemplate("Food Poisoning Complaints from Unauthorized Stall", "Roadside food cart operating without hygiene standards near hospital.", Category.PUBLIC_HEALTH, Priority.HIGH, Status.RESOLVED, "600040"),

                // Other Department
                new ComplaintTemplate("Encroachment of Public Footpath by Shop Vendors", "Commercial displays completely blocking pedestrian sidewalk.", Category.OTHER, Priority.MEDIUM, Status.ASSIGNED, "700001"),
                new ComplaintTemplate("Loud Noise Pollution from Generators Late Night", "Commercial establishment running un-silenced diesel generator past 11 PM.", Category.OTHER, Priority.HIGH, Status.RESOLVED, "600040"),
                new ComplaintTemplate("Park Lighting Defective & Broken Benches", "Public garden neglected, dark corners creating safety concerns.", Category.OTHER, Priority.LOW, Status.RESOLVED, "600001"),
                new ComplaintTemplate("Stray Cattle Blocking Traffic on Main Highway", "Cattle wandering across 4-lane highway causing traffic jams.", Category.OTHER, Priority.HIGH, Status.IN_PROGRESS, "560001")
        );
    }
}
