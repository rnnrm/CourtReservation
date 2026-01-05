using CourtBooking.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace CourtBooking.Server.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class BookingsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public BookingsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: api/<Bookings>
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Reservation>>> Get([FromQuery] DateTimeOffset? start, [FromQuery] DateTimeOffset? end, [FromQuery] int court)
        {

            // Load reservations from DB (Start/End are stored as strings in current model).
            var reservations = await _db.Reservations.Where(r => r.ExtendedProps.Court == court).ToListAsync();

            // If no range provided, return all
            if (!start.HasValue && !end.HasValue)
                return Ok(reservations);

            // Filter in-memory by attempting to parse reservation Start/End strings.
            var filtered = reservations.Where(r =>
            {
                var reservationEffectiveStart = r.Start == null ? r.Date!.Value : r.Start.Value;
                var reservationEffectiveEnd = r.End == null ? r.Date!.Value : r.End.Value;
                // Both provided -> check overlap (reservationStart < rangeEnd && (reservationEnd ?? reservationStart) >= rangeStart)
                if (start.HasValue && end.HasValue)
                {
                    return reservationEffectiveStart < end.Value && reservationEffectiveEnd >= start.Value;
                }

                // Interpret range as inclusive start and exclusive end [start, end)
                // If only startDt provided -> reservation must start >= startDt
                if (start.HasValue)
                {
                    return reservationEffectiveEnd >= start.Value;
                }

                // If only end provided -> reservation must start < end
                if (end.HasValue)
                {
                    return reservationEffectiveStart < end.Value;
                }


                return false;
            }).ToList();

            return Ok(filtered);
        }

        // GET api/<Bookings>/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Reservation>> Get(string id)
        {
            var res = await _db.Reservations.FindAsync(id);
            if (res == null) return NotFound();
            return Ok(res);
        }

        // POST api/<Bookings>
        [HttpPost]
        public async Task<ActionResult> Post([FromBody] Reservation reservation)
        {
            if (reservation == null) return BadRequest();

            await _db.Reservations.AddAsync(reservation);
            await _db.SaveChangesAsync();

            // Return 201 Created with location header
            return CreatedAtAction(nameof(Get), new { id = reservation.Id }, reservation);

        }

        // PUT api/<Bookings>/5
        [HttpPut]
        public async Task<IActionResult> Put([FromServices] SignInManager<AppUser> signInManager, [FromBody] Reservation reservation)
        {
            if (reservation == null) return BadRequest();

            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            var user = await signInManager.UserManager.FindByEmailAsync(userEmail!);
            if (user?.Id != reservation.ExtendedProps.Owner && !User.IsInRole("Admin")) //!User.HasClaim(ClaimTypes.Email, reservation.ExtendedProps.Owner) &&
                return Unauthorized();

            var existing = await _db.Reservations.FindAsync(reservation.Id);
            if (existing == null) return NotFound();

            existing.Title = reservation.Title;
            existing.Start = reservation.Start;
            existing.End = reservation.End;
            existing.AllDay = reservation.AllDay;
            existing.Date = reservation.Date;
            existing.ClassName = reservation.ClassName;
            existing.BackgroundColor = reservation.BackgroundColor;
            existing.ExtendedProps.Court = reservation.ExtendedProps.Court;
            existing.ExtendedProps.Description = reservation.ExtendedProps.Description;
            //existing.ExtendedProps.Owner = reservation.ExtendedProps.Owner;

            _db.Reservations.Update(existing);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        public record DeleteBookingDto(string BookingId, string UserId);

        [Authorize]
        // DELETE api/<Bookings>
        [HttpDelete]
        public async Task<IActionResult> Delete([FromServices] SignInManager<AppUser> signInManager,
            [FromBody] DeleteBookingDto deleteBookingDto)
        {
            Console.WriteLine("User.Claims: " + string.Concat(User.Claims));

            //user must own reservation or be admin
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            var user = await signInManager.UserManager.FindByEmailAsync(userEmail!);

            if (user?.Id != deleteBookingDto.UserId && !User.IsInRole("Admin")) //!User.HasClaim(ClaimTypes.Email, deleteBookingDto.Email) 
                return Unauthorized();

            var existing = await _db.Reservations.FindAsync(deleteBookingDto.BookingId);
            if (existing == null) return NotFound();

            _db.Reservations.Remove(existing);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
