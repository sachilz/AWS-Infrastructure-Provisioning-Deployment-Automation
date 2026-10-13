output "vpc_id" {
  description = "ID of the project VPC"
  value       = aws_vpc.main.id
}

output "ec2_instance_id" {
  description = "ID of the website EC2 instance"
  value       = aws_instance.web.id
}

output "public_ip" {
  description = "Public IPv4 address of the website server"
  value       = aws_instance.web.public_ip
}

output "website_url" {
  description = "HTTP URL for the website"
  value       = "http://${aws_instance.web.public_ip}"
}
