using MimeKit;
using MailKit.Net.Smtp;

namespace CourtBooking.Server
{
    public class EmailSender(string Server, string Username, string Password)
    {

            public async void SendAPI(string From, string To, string Subject, string Message)
            {
                using (var client = new HttpClient())
                {
                    // The URL you want to POST to
                    var url = "https://smtp.maileroo.com/api/v2/emails";
                    // JSON payload 
                    var json = $"from: {From}, to: {To}, subject: {Subject}, plain: {Message}"; 
                    var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json"); 
                    // Send POST request 
                    HttpResponseMessage response = await client.PostAsync(url, content); 
                    // Read response 
                    string result = await response.Content.ReadAsStringAsync(); 
                    Console.WriteLine(result); 
                }

            }
            public void Send(string? From, string To, string Subject, string Message)
            {
                if (From==null)
                    From = Username;
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("KenRho site", From));
                message.To.Add(new MailboxAddress("UUser", To));
                message.Subject = Subject;

                message.Body = new TextPart("plain")
                {
                    Text = Message
                };

                using (var client = new SmtpClient())
                {
                    client.Connect(Server, 587, false);

                    // Note: only needed if the SMTP server requires authentication
                    client.Authenticate(Username, Password);

                    client.Send(message);
                    client.Disconnect(true);
                }
            }
     }
    

}
